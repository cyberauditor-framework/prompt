import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getDb } from "./db/database.js";
import { ensureLogDbExists, getLogDb, getLogDbPath } from "./db/logDatabase.js";
import { ensureNewsDbExists, getNewsDb, getNewsDbPath } from "./db/newsDatabase.js";
import { makeRoutingDecision, rankPatterns } from "./services/retrieval.js";
import { buildKeywordCloud, fetchAndStoreNews, NewsCardRow, parseKeywordsColumn } from "./services/news.js";
import { PromptPattern } from "./types.js";

const app = express();
const PORT = Number(process.env.PORT || 8787);
const appStartTime = Date.now();
const enterpriseDir = path.resolve(process.cwd(), "public", "enterprise");
const agenticLabDir = path.resolve(process.cwd(), "agentic-prompt-engineering-lab");
const missionControlDir = path.resolve(process.cwd(), "client", "dist");
const missionControlIndex = path.join(missionControlDir, "index.html");

type NewsRefreshJob = {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  message: string;
  cancelRequested: boolean;
  options: Record<string, unknown>;
  result: Record<string, unknown> | null;
  cards: Array<Record<string, unknown>>;
  keywordCloud: Record<string, number>;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

const newsRefreshJobs = new Map<string, NewsRefreshJob>();
const newsRefreshJobsRetentionMs = 1000 * 60 * 60;

function pruneNewsRefreshJobs() {
  const now = Date.now();
  for (const [jobId, job] of newsRefreshJobs.entries()) {
    const updatedAtMs = Date.parse(job.updatedAt);
    if (!Number.isFinite(updatedAtMs) || now - updatedAtMs > newsRefreshJobsRetentionMs) {
      newsRefreshJobs.delete(jobId);
    }
  }
}

async function loadLatestNewsSnapshot(limit = 1000) {
  const db = await getNewsDb();
  try {
    const rows = (await db.all(
      `SELECT id, company, title, url, validated, category, summary, keywords, published_at, last_checked_at, source_feed, created_at, updated_at
       FROM news_cards
       ORDER BY last_checked_at DESC
       LIMIT ?`,
      limit
    )) as NewsCardRow[];

    const normalized = rows.map((row) => ({
      ...row,
      validated: Boolean(row.validated),
      keywords: parseKeywordsColumn(row.keywords),
    }));

    return {
      cards: normalized,
      keywordCloud: buildKeywordCloud(rows),
    };
  } finally {
    await db.close();
  }
}

type EventLogLevel = "debug" | "info" | "warn" | "error";

type EventLogEntry = {
  level: EventLogLevel;
  category: string;
  message: string;
  details?: unknown;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  tokensIn?: number;
  tokensOut?: number;
  responseType?: "json" | "text" | "empty" | "unknown";
  component?: string;
  userContext?: string;
};

function safeStringify(value: unknown, maxLen = 6000): string {
  try {
    const text = JSON.stringify(value ?? null);
    return text.length > maxLen ? text.slice(0, maxLen) + "...<truncated>" : text;
  } catch {
    return JSON.stringify({ error: "Could not stringify details" });
  }
}

async function writeEventLog(entry: EventLogEntry) {
  try {
    const db = await getLogDb();
    await db.run(
      `INSERT INTO app_event_logs
       (level, category, message, details, endpoint, method, status_code, tokens_in, tokens_out, response_type, component, user_context)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      entry.level,
      entry.category,
      entry.message,
      safeStringify(entry.details ?? {}),
      entry.endpoint ?? null,
      entry.method ?? null,
      entry.statusCode ?? null,
      entry.tokensIn ?? null,
      entry.tokensOut ?? null,
      entry.responseType ?? null,
      entry.component ?? null,
      entry.userContext ?? null
    );
    await db.close();
  } catch {
    // Never throw from logging path
  }
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const isApiRequest = req.path.startsWith("/api/");
  const skipPaths = new Set(["/api/event-logs"]);

  res.on("finish", () => {
    if (!isApiRequest || skipPaths.has(req.path)) {
      return;
    }

    const durationMs = Date.now() - start;
    const level: EventLogLevel = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    void writeEventLog({
      level,
      category: "api_request",
      message: `${req.method} ${req.path} -> ${res.statusCode}`,
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      component: "server",
      details: {
        query: req.query,
        bodyPreview: req.body,
        durationMs,
        ip: req.ip,
      },
    });
  });

  next();
});

app.use("/enterprise", express.static(enterpriseDir));
app.use("/agentic-lab", express.static(agenticLabDir));
app.use("/mission-control", express.static(missionControlDir));

app.get("/enterprise", (_req, res) => {
  res.sendFile(path.join(enterpriseDir, "index.html"));
});

app.get("/agentic-lab", (_req, res) => {
  res.sendFile(path.join(agenticLabDir, "index.html"));
});

async function sendMissionControl(res: express.Response) {
  try {
    await fs.access(missionControlIndex);
    res.sendFile(missionControlIndex);
  } catch {
    res.status(503).send(
      "Mission Control build not found. Run npm run build and reload /mission-control."
    );
  }
}

app.get("/mission-control", async (_req, res) => {
  await sendMissionControl(res);
});

app.get("/mission-control/", async (_req, res) => {
  await sendMissionControl(res);
});

app.get("/mission-control/*", async (_req, res) => {
  await sendMissionControl(res);
});

app.get("/api/health", async (_req, res) => {
  let databaseOk = true;
  let databaseError = "";

  try {
    const db = await getDb();
    await db.get("SELECT 1 AS ping");
    await db.close();
  } catch (error) {
    databaseOk = false;
    databaseError = error instanceof Error ? error.message : "Unknown database error";
  }

  res.json({
    ok: databaseOk,
    serverTime: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - appStartTime) / 1000),
    database: {
      ok: databaseOk,
      error: databaseError || null,
    },
  });
});

app.get("/api/system-status", async (_req, res) => {
  let databaseOk = true;
  let databaseError = "";
  let patternsCount = 0;
  let logsCount = 0;
  let savedPromptsCount = 0;
  let eventLogsCount = 0;
  let newsCardsCount = 0;
  let newsArticlesCount = 0;
  let logDatabaseOk = true;
  let logDatabaseError = "";
  let newsDatabaseOk = true;
  let newsDatabaseError = "";
  let databaseCatalog: Array<{
    name: string;
    file: string;
    tableCount: number;
    totalRecords: number;
    tables: Record<string, number>;
  }> = [];

  try {
    const db = await getDb();
    await db.get("SELECT 1 AS ping");

    const hasSavedPrompts = await db.get(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'saved_prompts'"
    );

    const patternsRow = (await db.get("SELECT COUNT(*) AS count FROM prompt_patterns")) as { count: number };
    const logsRow = (await db.get("SELECT COUNT(*) AS count FROM prompt_logs")) as { count: number };
    patternsCount = Number(patternsRow?.count || 0);
    logsCount = Number(logsRow?.count || 0);

    if (hasSavedPrompts) {
      const savedPromptsRow = (await db.get("SELECT COUNT(*) AS count FROM saved_prompts")) as { count: number };
      savedPromptsCount = Number(savedPromptsRow?.count || 0);
    }

    const dbList = (await db.all("PRAGMA database_list")) as Array<{
      seq: number;
      name: string;
      file: string;
    }>;

    for (const dbItem of dbList) {
      if (!dbItem?.name) continue;

      const tables = (await db.all(
        `SELECT name FROM ${dbItem.name}.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
      )) as Array<{ name: string }>;

      const tableRecords: Record<string, number> = {};
      let totalRecords = 0;

      for (const table of tables) {
        const tableName = String(table.name || "");
        if (!tableName) continue;
        const safeTableName = tableName.replace(/"/g, '""');
        const countRow = (await db.get(
          `SELECT COUNT(*) AS count FROM ${dbItem.name}."${safeTableName}"`
        )) as { count: number };
        const count = Number(countRow?.count || 0);
        tableRecords[tableName] = count;
        totalRecords += count;
      }

      databaseCatalog.push({
        name: dbItem.name,
        file: dbItem.file || "(memory)",
        tableCount: tables.length,
        totalRecords,
        tables: tableRecords,
      });
    }

    await db.close();
  } catch (error) {
    databaseOk = false;
    databaseError = error instanceof Error ? error.message : "Unknown database error";
  }

  try {
    const logDb = await getLogDb();
    const eventLogsRow = (await logDb.get("SELECT COUNT(*) AS count FROM app_event_logs")) as { count: number };
    eventLogsCount = Number(eventLogsRow?.count || 0);
    await logDb.close();

    databaseCatalog.push({
      name: "logging",
      file: getLogDbPath(),
      tableCount: 1,
      totalRecords: eventLogsCount,
      tables: {
        app_event_logs: eventLogsCount,
      },
    });
  } catch (error) {
    logDatabaseOk = false;
    logDatabaseError = error instanceof Error ? error.message : "Unknown log database error";
  }

  try {
    const newsDb = await getNewsDb();
    const newsCardsRow = (await newsDb.get("SELECT COUNT(*) AS count FROM news_cards")) as { count: number };
    const newsArticlesRow = (await newsDb.get("SELECT COUNT(*) AS count FROM news_articles")) as { count: number };
    newsCardsCount = Number(newsCardsRow?.count || 0);
    newsArticlesCount = Number(newsArticlesRow?.count || 0);
    await newsDb.close();

    databaseCatalog.push({
      name: "news",
      file: getNewsDbPath(),
      tableCount: 2,
      totalRecords: newsCardsCount + newsArticlesCount,
      tables: {
        news_cards: newsCardsCount,
        news_articles: newsArticlesCount,
      },
    });
  } catch (error) {
    newsDatabaseOk = false;
    newsDatabaseError = error instanceof Error ? error.message : "Unknown news database error";
  }

  const apiServerOk = true;

  res.json({
    ok: apiServerOk && databaseOk && logDatabaseOk && newsDatabaseOk,
    server: {
      ok: apiServerOk,
      port: PORT,
      uptimeSeconds: Math.floor((Date.now() - appStartTime) / 1000),
      now: new Date().toISOString(),
    },
    database: {
      ok: databaseOk,
      error: databaseError || null,
      counts: {
        promptPatterns: patternsCount,
        promptLogs: logsCount,
        savedPrompts: savedPromptsCount,
        eventLogs: eventLogsCount,
        newsCards: newsCardsCount,
        newsArticles: newsArticlesCount,
      },
      catalog: databaseCatalog,
    },
    loggingDatabase: {
      ok: logDatabaseOk,
      error: logDatabaseError || null,
      file: getLogDbPath(),
      counts: {
        eventLogs: eventLogsCount,
      },
    },
    newsDatabase: {
      ok: newsDatabaseOk,
      error: newsDatabaseError || null,
      file: getNewsDbPath(),
      counts: {
        newsCards: newsCardsCount,
        newsArticles: newsArticlesCount,
      },
    },
    endpoints: {
      health: true,
      systemStatus: true,
      patterns: true,
      compile: true,
      execute: true,
      logs: true,
      eventLogsRead: true,
      eventLogsWrite: true,
      helpLibrary: true,
      promptLibrary: true,
      promptTags: true,
      newsCards: true,
      newsRefresh: true,
      newsRefreshStart: true,
      newsRefreshStatus: true,
      newsRefreshCancel: true,
    },
  });
});

app.get("/api/news/cards", async (req, res) => {
  const limitParam = String(req.query.limit || "").trim().toLowerCase();
  let limit: number | null = 200;
  if (!limitParam || limitParam === "all") {
    limit = null;
  } else {
    const parsedLimit = Number(limitParam);
    if (Number.isFinite(parsedLimit)) {
      limit = Math.min(Math.max(Math.floor(parsedLimit), 1), 10000);
    }
  }
  const company = req.query.company ? String(req.query.company) : null;
  const category = req.query.category ? String(req.query.category) : null;
  const days = req.query.days ? Math.max(1, Math.floor(Number(req.query.days))) : null;
  const db = await getNewsDb();

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (company) { conditions.push("company = ?"); params.push(company); }
  if (category) { conditions.push("category = ?"); params.push(category); }
  if (days) { conditions.push("last_checked_at >= datetime('now', ?)"); params.push(`-${days} days`); }

  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const totalRow = (await db.get(
    `SELECT COUNT(*) AS count
     FROM news_cards
     ${whereClause}`,
    ...params
  )) as { count: number };

  const query =
    `SELECT id, company, title, url, validated, category, summary, keywords, published_at, last_checked_at, source_feed, created_at, updated_at
     FROM news_cards
     ${whereClause}
     ORDER BY last_checked_at DESC` +
    (limit ? "\n     LIMIT ?" : "");

  const queryParams = limit ? params.concat(limit) : params;

  const rows = (await db.all(
    query,
    ...queryParams
  )) as NewsCardRow[];

  await db.close();

  const normalized = rows.map((row) => ({
    ...row,
    validated: Boolean(row.validated),
    keywords: parseKeywordsColumn(row.keywords),
  }));

  res.json({
    cards: normalized,
    keywordCloud: buildKeywordCloud(rows),
    total: Number(totalRow?.count || 0),
    returned: normalized.length,
    limitApplied: limit,
  });
});

const newsRefreshSchema = z.object({
  perFeedLimit: z.number().int().min(10).max(500).optional(),
  maxCandidates: z.number().int().min(50).max(2000).optional(),
  includeSeedUrls: z.boolean().optional(),
  includeGoogleNews: z.boolean().optional(),
  preferRecentDays: z.number().int().min(1).max(365).optional(),
}).optional();

app.post("/api/news/refresh/start", async (req, res) => {
  const parsed = newsRefreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  pruneNewsRefreshJobs();

  const jobId = randomUUID();
  const nowIso = new Date().toISOString();
  const job: NewsRefreshJob = {
    id: jobId,
    status: "queued",
    progress: 5,
    message: "Queued",
    cancelRequested: false,
    options: (parsed.data || {}) as Record<string, unknown>,
    result: null,
    cards: [],
    keywordCloud: {},
    error: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  newsRefreshJobs.set(jobId, job);

  void (async () => {
    const target = newsRefreshJobs.get(jobId);
    if (!target) return;

    if (target.cancelRequested) {
      target.status = "cancelled";
      target.progress = 100;
      target.message = "Cancelled before start";
      target.updatedAt = new Date().toISOString();
      return;
    }

    target.status = "running";
    target.progress = 12;
    target.message = "Starting background retrieval";
    target.updatedAt = new Date().toISOString();

    let pulse = 12;
    const pulseTimer = setInterval(() => {
      const active = newsRefreshJobs.get(jobId);
      if (!active || active.status !== "running") {
        clearInterval(pulseTimer);
        return;
      }
      pulse = Math.min(92, pulse + 4);
      active.progress = Math.max(active.progress, pulse);
      active.updatedAt = new Date().toISOString();
    }, 1200);

    try {
      const db = await getNewsDb();
      target.progress = 18;
      target.message = "Retrieving sources and validating URLs";
      target.updatedAt = new Date().toISOString();

      const result = (await fetchAndStoreNews(db, parsed.data || {})) as Record<string, unknown>;
      await db.close();

      if (target.cancelRequested) {
        target.status = "cancelled";
        target.progress = 100;
        target.message = "Cancelled";
        target.updatedAt = new Date().toISOString();
        return;
      }

      target.progress = 95;
      target.message = "Preparing latest snapshot";
      target.updatedAt = new Date().toISOString();

      const snapshot = await loadLatestNewsSnapshot(1000);
      target.result = result;
      target.cards = snapshot.cards as Array<Record<string, unknown>>;
      target.keywordCloud = snapshot.keywordCloud;
      target.status = "completed";
      target.progress = 100;
      target.message = "Completed";
      target.updatedAt = new Date().toISOString();
    } catch (error) {
      if (target.cancelRequested) {
        target.status = "cancelled";
        target.progress = 100;
        target.message = "Cancelled";
        target.updatedAt = new Date().toISOString();
      } else {
        target.status = "failed";
        target.progress = 100;
        target.error = error instanceof Error ? error.message : "Unknown error";
        target.message = "Failed";
        target.updatedAt = new Date().toISOString();
      }
    } finally {
      clearInterval(pulseTimer);
      pruneNewsRefreshJobs();
    }
  })();

  res.json({
    ok: true,
    jobId,
    status: job.status,
    progress: job.progress,
    message: job.message,
    cancelRequested: job.cancelRequested,
  });
});

app.post("/api/news/refresh/cancel/:jobId", (req, res) => {
  const jobId = String(req.params.jobId || "").trim();
  const job = newsRefreshJobs.get(jobId);
  if (!job) {
    return res.status(404).json({ error: "Background refresh job not found", jobId });
  }

  if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
    return res.json({
      ok: true,
      jobId,
      status: job.status,
      progress: job.progress,
      message: job.message,
    });
  }

  job.cancelRequested = true;
  job.updatedAt = new Date().toISOString();

  if (job.status === "queued") {
    job.status = "cancelled";
    job.progress = 100;
    job.message = "Cancelled before start";
  } else {
    job.message = "Cancellation requested";
  }

  return res.json({
    ok: true,
    jobId,
    status: job.status,
    progress: job.progress,
    message: job.message,
    cancelRequested: job.cancelRequested,
  });
});

app.get("/api/news/refresh/status/:jobId", (req, res) => {
  const jobId = String(req.params.jobId || "").trim();
  const job = newsRefreshJobs.get(jobId);
  if (!job) {
    return res.status(404).json({ error: "Background refresh job not found", jobId });
  }

  return res.json({
    ok: true,
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    message: job.message,
    cancelRequested: job.cancelRequested,
    result: job.result,
    cards: job.status === "completed" ? job.cards : [],
    keywordCloud: job.status === "completed" ? job.keywordCloud : {},
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
});

app.post("/api/news/refresh", async (req, res) => {
  const parsed = newsRefreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const db = await getNewsDb();
  try {
    const result = await fetchAndStoreNews(db, parsed.data || {});
    const rows = (await db.all(
      `SELECT id, company, title, url, validated, category, summary, keywords, published_at, last_checked_at, source_feed, created_at, updated_at
       FROM news_cards
       ORDER BY last_checked_at DESC
       LIMIT 1000`
    )) as NewsCardRow[];

    const normalized = rows.map((row) => ({
      ...row,
      validated: Boolean(row.validated),
      keywords: parseKeywordsColumn(row.keywords),
    }));

    res.json({
      ok: true,
      result,
      cards: normalized,
      keywordCloud: buildKeywordCloud(rows),
    });
  } catch (error) {
    res.status(500).json({
      error: "News refresh failed on server",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    await db.close();
  }
});

const newsAnalyzeSchema = z.object({
  baseUrl: z.string().url(),
  model: z.string().min(1),
  apiKey: z.string().optional(),
  prompt: z.string().min(10),
  timeout: z.number().int().min(1000).max(600000).optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(256).max(12000).optional(),
  articleTitle: z.string().min(3).optional(),
  weekStart: z.string().optional(),
  weekEnd: z.string().optional(),
  reactMode: z.boolean().optional(),
  reasoningEffort: z.enum(["low", "medium", "high"]).optional(),
  useInternalReasoning: z.boolean().optional(),
});

app.post("/api/news/analyze", async (req, res) => {
  const parsed = newsAnalyzeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const {
    baseUrl,
    model,
    apiKey,
    prompt,
    timeout,
    systemPrompt,
    temperature,
    maxTokens,
    articleTitle,
    weekStart,
    weekEnd,
    reactMode,
    reasoningEffort,
    useInternalReasoning,
  } = parsed.data;

  const cleanBase = String(baseUrl || "").trim().replace(/\/$/, "");
  const endpoint = /\/v1$/i.test(cleanBase)
    ? cleanBase + "/chat/completions"
    : cleanBase + "/v1/chat/completions";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey && apiKey.trim()) {
    headers.Authorization = `Bearer ${apiKey.trim()}`;
  }

  const systemBase =
    systemPrompt && systemPrompt.trim()
      ? systemPrompt.trim()
      : "You are a senior AI and cybersecurity intelligence analyst. Return rigorous, source-linked, professional output.";

  const systemAdditions: string[] = [];
  if (reactMode) {
    systemAdditions.push(
      "Use ReAct-style execution internally: plan -> search -> verify URLs -> synthesize. Do not expose internal traces; provide concise final conclusions with evidence."
    );
  }
  if (useInternalReasoning) {
    systemAdditions.push(
      "Reason deeply internally, but do not reveal chain-of-thought. Output only the final, concise analysis and source-backed findings."
    );
  }

  const payload: Record<string, unknown> = {
    model,
    messages: [
      {
        role: "system",
        content: [systemBase].concat(systemAdditions).join("\n\n"),
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: typeof temperature === "number" ? temperature : 0.2,
    max_tokens: typeof maxTokens === "number" ? maxTokens : 4000,
  };

  if (reasoningEffort) {
    payload.reasoning = { effort: reasoningEffort };
  }

  const promptChars = String(prompt || "").length;
  const promptTokenEstimate = Math.max(1, Math.ceil(promptChars / 4));
  // Default timeout increased from 180s (3 min) → 360s (6 min) to accommodate 200-article context
  const requestTimeoutMs = Math.min(
    600000,
    Math.max(360000, Number.isFinite(timeout) ? Number(timeout) : 360000)
  );

  // ✅ CRITICAL FIX: Timer cleanup moved outside try-catch, with finally block guarantee
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const raw = await response.text();
    let json: any = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = null;
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: "LLM upstream request failed",
        endpoint,
        status: response.status,
        details: json || raw?.slice(0, 1500) || null,
      });
    }

    const content =
      json?.choices?.[0]?.message?.content ??
      json?.choices?.[0]?.text ??
      "";

    if (!String(content || "").trim()) {
      return res.status(502).json({
        error: "LLM response did not include text content",
        endpoint,
      });
    }

    const articleDb = await getNewsDb();
    try {
      await articleDb.run(
        `INSERT INTO news_articles
          (title, content_markdown, model, llm_endpoint, week_start, week_end)
         VALUES (?, ?, ?, ?, ?, ?)`,
        articleTitle && articleTitle.trim()
          ? articleTitle.trim()
          : `Weekly LLM Intelligence Report ${new Date().toISOString().slice(0, 10)}`,
        String(content),
        model,
        endpoint,
        weekStart || null,
        weekEnd || null
      );
    } finally {
      await articleDb.close();
    }

    return res.json({
      ok: true,
      analysis: String(content),
      endpoint,
      model,
      usage: json?.usage || null,
      requestMeta: {
        promptChars,
        promptTokenEstimate,
        reasoningEffort: reasoningEffort || null,
        reactMode: Boolean(reactMode),
      },
    });
  } catch (error) {
    // ✅ NEW: Detect AbortError explicitly (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(504).json({
        error: "LLM_TIMEOUT",
        timeout_ms: requestTimeoutMs,
        timeout_seconds: Math.round(requestTimeoutMs / 1000),
        endpoint,
        message: `Request timed out after ${Math.round(requestTimeoutMs / 1000)}s`,
        hint: "Try: (1) Increase timeout in Settings, (2) Use a faster model, or (3) Reduce context to 100 articles",
        suggestion_increase_timeout: Math.round(requestTimeoutMs / 1000) + 60,
      });
    }

    // ✅ NEW: Detect unreachable endpoint (network error)
    if (error instanceof Error && (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('connect')
    )) {
      return res.status(503).json({
        error: "LLM_UNREACHABLE",
        endpoint,
        message: "LLM endpoint is not responding. Verify LM Studio is running.",
      });
    }

    // Generic error fallback
    return res.status(502).json({
      error: "Failed to reach LLM endpoint",
      endpoint,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    // ✅ NEW: ALWAYS clear timer, even if abort occurred (prevents memory leak)
    clearTimeout(timer);
  }
});

app.get("/api/help-library", async (_req, res) => {
  const docsDir = path.resolve(process.cwd(), "docs");

  let fileNames: string[] = [];
  try {
    const entries = await fs.readdir(docsDir);
    fileNames = entries.filter((f) => f.toLowerCase().endsWith(".md")).sort();
  } catch {
    return res.status(404).json({ docs: [] });
  }

  if (!fileNames.length) {
    return res.status(404).json({ docs: [] });
  }

  function fileNameToTitle(fileName: string): string {
    return fileName
      .replace(/\.md$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function fileNameToId(fileName: string): string {
    return fileName
      .replace(/\.md$/i, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  const docs = (
    await Promise.all(
      fileNames.map(async (fileName) => {
        const fullPath = path.join(docsDir, fileName);
        try {
          const markdown = await fs.readFile(fullPath, "utf-8");
          return {
            id: fileNameToId(fileName),
            title: fileNameToTitle(fileName),
            fileName,
            markdown,
          };
        } catch {
          return null;
        }
      })
    )
  ).filter((d): d is { id: string; title: string; fileName: string; markdown: string } => d !== null);

  return res.json({ docs });
});

app.get("/api/v1/models", async (req, res) => {
  const rawBaseUrl = String(req.query.baseUrl || process.env.LLM_BASE_URL || "http://localhost:1234/v1").trim();
  const baseUrl = rawBaseUrl.replace(/\/$/, "");
  const upstream = /\/v1$/i.test(baseUrl) ? baseUrl + "/models" : baseUrl + "/v1/models";

  const headers: Record<string, string> = {};
  const auth = req.get("authorization");
  if (auth) {
    headers.Authorization = auth;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(upstream, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const text = await response.text();
    const contentType = String(response.headers.get("content-type") || "");

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Upstream model endpoint returned an error",
        endpoint: upstream,
        status: response.status,
        details: text.slice(0, 500),
      });
    }

    if (!contentType.includes("application/json")) {
      return res.status(502).json({
        error: "Upstream model endpoint did not return JSON",
        endpoint: upstream,
        contentType: contentType || null,
        details: text.slice(0, 500),
      });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      return res.status(502).json({
        error: "Upstream model endpoint returned invalid JSON",
        endpoint: upstream,
      });
    }

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(502).json({
      error: "Failed to reach upstream model endpoint",
      endpoint: upstream,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/patterns", async (req, res) => {
  const query = String(req.query.query || "");
  const db = await getDb();

  const rows = (await db.all(
    "SELECT id, pattern_name, category, template, best_for_llm, COALESCE(keywords, '') AS keywords FROM prompt_patterns"
  )) as PromptPattern[];

  const ranked = rankPatterns(query, rows);
  await db.close();

  res.json({ patterns: ranked });
});

const compileSchema = z.object({
  goal: z.string().min(3),
  agentType: z.string().min(3),
  selectedPatternIds: z.array(z.number()).default([]),
  variables: z.record(z.string()).default({}),
});

app.post("/api/compile", async (req, res) => {
  const parsed = compileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { goal, agentType, selectedPatternIds, variables } = parsed.data;
  const db = await getDb();

  const patterns = selectedPatternIds.length
    ? ((await db.all(
        `SELECT id, pattern_name, category, template, best_for_llm, COALESCE(keywords, '') AS keywords
         FROM prompt_patterns WHERE id IN (${selectedPatternIds.map(() => "?").join(",")})`,
        ...selectedPatternIds
      )) as PromptPattern[])
    : [];

  const routing = makeRoutingDecision(goal);

  const variableBlock = Object.entries(variables)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const patternBlock = patterns
    .map((pattern) => {
      const hydrated = pattern.template.replaceAll("{{input}}", goal);
      return `[${pattern.pattern_name}]\n${hydrated}`;
    })
    .join("\n\n---\n\n");

  const finalPrompt = [
    `ROLE: You are an expert ${agentType}.`,
    `GOAL: ${goal}`,
    `ROUTING_DECISION: ${routing.route} (confidence ${routing.confidence})`,
    "REASONING_PATTERNS:",
    patternBlock || "No pattern selected.",
    "VARIABLES:",
    variableBlock || "No variables provided.",
    "CONSTRAINTS: Output JSON only. Perform a self-critique pass before final answer.",
  ].join("\n\n");

  await db.close();

  return res.json({ finalPrompt, routing });
});

const executeSchema = z.object({
  inputText: z.string().min(1),
  model: z.string().min(2),
  halted: z.boolean().default(false),
});

app.post("/api/execute", async (req, res) => {
  const parsed = executeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { inputText, model, halted } = parsed.data;

  const thought = halted
    ? "Execution paused by operator. Awaiting approval."
    : "Checked prompt for routing and safety constraints before generation.";

  const outputText = halted
    ? "No output generated while halted."
    : `{"model":"${model}","status":"ok","summary":"Prompt executed in sandbox mode."}`;

  const feedbackScore = halted ? 0 : 88;

  const db = await getDb();
  await db.run(
    "INSERT INTO prompt_logs (input_text, output_text, feedback_score) VALUES (?, ?, ?)",
    inputText,
    outputText,
    feedbackScore
  );

  const trace = [
    "Router analyzed request intent.",
    "Selected agent strategy based on route confidence.",
    "Applied self-critique and constraint enforcement.",
  ];

  await db.close();

  return res.json({
    hiddenReasoning: thought,
    outputText,
    feedbackScore,
    trace,
  });
});

app.get("/api/logs", async (_req, res) => {
  const db = await getDb();
  const rows = await db.all(
    "SELECT id, input_text, output_text, feedback_score, timestamp FROM prompt_logs ORDER BY id DESC LIMIT 30"
  );
  await db.close();
  res.json({ logs: rows });
});

const eventLogCreateSchema = z.object({
  level: z.enum(["debug", "info", "warn", "error"]).default("info"),
  category: z.string().min(1).default("ui"),
  message: z.string().min(1),
  details: z.unknown().optional(),
  endpoint: z.string().optional(),
  method: z.string().optional(),
  statusCode: z.number().int().optional(),
  tokensIn: z.number().int().nonnegative().optional(),
  tokensOut: z.number().int().nonnegative().optional(),
  responseType: z.enum(["json", "text", "empty", "unknown"]).optional(),
  component: z.string().default("client"),
  userContext: z.string().optional(),
});

app.post("/api/event-logs", async (req, res) => {
  const parsed = eventLogCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  await writeEventLog(parsed.data);
  return res.status(201).json({ ok: true });
});

app.get("/api/event-logs", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 200), 1), 1000);
  const level = req.query.level ? String(req.query.level) : null;
  const db = await getLogDb();

  const rows = level
    ? await db.all(
        `SELECT id, level, category, message, details, endpoint, method, status_code, tokens_in, tokens_out, response_type, component, user_context, created_at
         FROM app_event_logs
         WHERE level = ?
         ORDER BY id DESC
         LIMIT ?`,
        level,
        limit
      )
    : await db.all(
        `SELECT id, level, category, message, details, endpoint, method, status_code, tokens_in, tokens_out, response_type, component, user_context, created_at
         FROM app_event_logs
         ORDER BY id DESC
         LIMIT ?`,
        limit
      );

  await db.close();
  res.json({ logs: rows });
});

app.get("/api/event-logs/review", async (_req, res) => {
  const db = await getLogDb();

  const totalRow = (await db.get("SELECT COUNT(*) AS count FROM app_event_logs")) as { count: number };
  const levelRows = (await db.all(
    "SELECT level, COUNT(*) AS count FROM app_event_logs GROUP BY level ORDER BY count DESC"
  )) as Array<{ level: string; count: number }>;
  const categoryRows = (await db.all(
    "SELECT category, COUNT(*) AS count FROM app_event_logs GROUP BY category ORDER BY count DESC LIMIT 15"
  )) as Array<{ category: string; count: number }>;
  const endpointRows = (await db.all(
    "SELECT endpoint, method, COUNT(*) AS count FROM app_event_logs WHERE endpoint IS NOT NULL GROUP BY endpoint, method ORDER BY count DESC LIMIT 15"
  )) as Array<{ endpoint: string; method: string; count: number }>;
  const llmTokenRow = (await db.get(
    "SELECT COALESCE(SUM(tokens_in),0) AS in_total, COALESCE(SUM(tokens_out),0) AS out_total FROM app_event_logs"
  )) as { in_total: number; out_total: number };
  const responseTypeRows = (await db.all(
    "SELECT response_type, COUNT(*) AS count FROM app_event_logs WHERE response_type IS NOT NULL GROUP BY response_type ORDER BY count DESC"
  )) as Array<{ response_type: string; count: number }>;

  await db.close();

  res.json({
    totalLogs: Number(totalRow?.count || 0),
    byLevel: levelRows,
    topCategories: categoryRows,
    topEndpoints: endpointRows,
    tokenTotals: {
      tokensIn: Number(llmTokenRow?.in_total || 0),
      tokensOut: Number(llmTokenRow?.out_total || 0),
    },
    responseTypes: responseTypeRows,
  });
});

app.listen(PORT, async () => {
  // Auto-create saved_prompts table if it doesn't exist (safe migration)
  await ensureLogDbExists();
  await ensureNewsDbExists();

  const db = await getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS saved_prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

  `);
  await db.close();

  const logDb = await getLogDb();
  await logDb.exec(`
    CREATE TABLE IF NOT EXISTS app_event_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      details TEXT,
      endpoint TEXT,
      method TEXT,
      status_code INTEGER,
      tokens_in INTEGER,
      tokens_out INTEGER,
      response_type TEXT,
      component TEXT,
      user_context TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await logDb.close();

  const newsDb = await getNewsDb();
  await newsDb.exec(`
    CREATE TABLE IF NOT EXISTS news_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      validated INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'news',
      summary TEXT,
      keywords TEXT NOT NULL DEFAULT '[]',
      published_at TEXT,
      source_feed TEXT,
      last_checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS news_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content_markdown TEXT NOT NULL,
      model TEXT,
      llm_endpoint TEXT,
      week_start TEXT,
      week_end TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_news_cards_company ON news_cards(company);
    CREATE INDEX IF NOT EXISTS idx_news_cards_category ON news_cards(category);
    CREATE INDEX IF NOT EXISTS idx_news_cards_checked ON news_cards(last_checked_at);
    CREATE INDEX IF NOT EXISTS idx_news_articles_created ON news_articles(created_at);
  `);
  await newsDb.close();

  // Best-effort migration from previous combined DB to dedicated log DB.
  try {
    const sourceDb = await getDb();
    const hasLegacy = await sourceDb.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='app_event_logs'"
    );
    if (hasLegacy) {
      const legacyRows = await sourceDb.all(
        `SELECT level, category, message, details, endpoint, method, status_code, component, user_context, created_at
         FROM app_event_logs`
      );

      if (legacyRows.length) {
        const targetDb = await getLogDb();
        const existingRow = (await targetDb.get("SELECT COUNT(*) AS count FROM app_event_logs")) as { count: number };
        if (Number(existingRow?.count || 0) === 0) {
          for (const row of legacyRows) {
            await targetDb.run(
              `INSERT INTO app_event_logs
               (level, category, message, details, endpoint, method, status_code, component, user_context, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              row.level,
              row.category,
              row.message,
              row.details,
              row.endpoint,
              row.method,
              row.status_code,
              row.component,
              row.user_context,
              row.created_at
            );
          }
        }
        await targetDb.close();
      }
    }
    await sourceDb.close();
  } catch {
    // Non-fatal migration path.
  }

  console.log(`Prompt Coach API listening on http://localhost:${PORT}`);
  console.log(`Enterprise UI: http://localhost:${PORT}/enterprise`);
  console.log(`Agentic Lab: http://localhost:${PORT}/agentic-lab/`);
  console.log(`Prompt Assistant: http://localhost:${PORT}/agentic-lab/prompt-assistant.html`);
  console.log(`Techniques: http://localhost:${PORT}/agentic-lab/techniques.html`);
});

// ── Prompt Library CRUD ──────────────────────────────────────────────────────

app.get("/api/library", async (req, res) => {
  const tag = req.query.tag ? String(req.query.tag) : null;
  const db = await getDb();
  let rows;
  if (tag) {
    rows = await db.all(
      `SELECT id, title, content, tags, created_at, updated_at FROM saved_prompts
       WHERE json_each.value = ? AND tags LIKE '%' || ? || '%'
       ORDER BY updated_at DESC`,
      tag, tag
    );
    // Simpler: filter in JS to avoid SQLite JSON quirks
    const all = await db.all(
      "SELECT id, title, content, tags, created_at, updated_at FROM saved_prompts ORDER BY updated_at DESC"
    );
    rows = all.filter((r: any) => {
      try { return JSON.parse(r.tags).includes(tag); } catch { return false; }
    });
  } else {
    rows = await db.all(
      "SELECT id, title, content, tags, created_at, updated_at FROM saved_prompts ORDER BY updated_at DESC"
    );
  }
  await db.close();
  res.json({ prompts: rows });
});

app.get("/api/library/tags", async (_req, res) => {
  const db = await getDb();
  const rows: any[] = await db.all("SELECT tags FROM saved_prompts");
  await db.close();
  const counts: Record<string, number> = {};
  for (const row of rows) {
    try {
      const tags: string[] = JSON.parse(row.tags);
      for (const t of tags) {
        if (t) counts[t] = (counts[t] || 0) + 1;
      }
    } catch { /* ignore malformed */ }
  }
  res.json({ tags: counts });
});

const libraryCreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

app.post("/api/library", async (req, res) => {
  const parsed = libraryCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { title, content, tags } = parsed.data;
  const db = await getDb();
  const result = await db.run(
    "INSERT INTO saved_prompts (title, content, tags) VALUES (?, ?, ?)",
    title, content, JSON.stringify(tags)
  );
  const row = await db.get("SELECT * FROM saved_prompts WHERE id = ?", result.lastID);
  await db.close();
  return res.status(201).json({ prompt: row });
});

const libraryUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

app.put("/api/library/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid id" });
  const parsed = libraryUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { title, content, tags } = parsed.data;
  const db = await getDb();
  const existing: any = await db.get("SELECT * FROM saved_prompts WHERE id = ?", id);
  if (!existing) { await db.close(); return res.status(404).json({ error: "Not found" }); }
  await db.run(
    `UPDATE saved_prompts SET
       title = ?, content = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    title ?? existing.title,
    content ?? existing.content,
    tags !== undefined ? JSON.stringify(tags) : existing.tags,
    id
  );
  const row = await db.get("SELECT * FROM saved_prompts WHERE id = ?", id);
  await db.close();
  return res.json({ prompt: row });
});

app.delete("/api/library/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid id" });
  const db = await getDb();
  const existing = await db.get("SELECT id FROM saved_prompts WHERE id = ?", id);
  if (!existing) { await db.close(); return res.status(404).json({ error: "Not found" }); }
  await db.run("DELETE FROM saved_prompts WHERE id = ?", id);
  await db.close();
  return res.json({ ok: true });
});

app.use((error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const err = error as Error;
  const message = err?.message || "Unhandled server error";

  void writeEventLog({
    level: "error",
    category: "server_error",
    message,
    endpoint: req.path,
    method: req.method,
    statusCode: 500,
    component: "server",
    details: {
      name: err?.name,
      stack: err?.stack,
      query: req.query,
      body: req.body,
      headers: {
        "user-agent": req.get("user-agent"),
        origin: req.get("origin"),
        referer: req.get("referer"),
      },
    },
  });

  res.status(500).json({
    error: "Internal server error",
    message,
  });
});

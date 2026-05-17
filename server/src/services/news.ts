import { Database } from "sqlite";

type Provider = {
  company: string;
  feeds: string[];
  seedUrls: Array<{ title: string; url: string; category?: string }>;
};

type NewsCandidate = {
  company: string;
  title: string;
  url: string;
  publishedAt?: string | null;
  category?: string;
  sourceFeed?: string;
  previewText?: string;
};

type ValidatedNews = NewsCandidate & {
  validated: boolean;
  summary: string;
  keywords: string[];
};

export type NewsRefreshOptions = {
  perFeedLimit?: number;
  maxCandidates?: number;
  includeSeedUrls?: boolean;
  includeGoogleNews?: boolean;
  preferRecentDays?: number;
};

const providers: Provider[] = [
  {
    company: "Anthropic",
    feeds: ["https://www.anthropic.com/news/rss.xml"],
    seedUrls: [
      {
        title: "Anthropic Prompt Engineering Overview",
        url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
        category: "tutorial",
      },
      {
        title: "Anthropic Building Effective Agents",
        url: "https://www.anthropic.com/engineering/building-effective-agents",
        category: "research",
      },
    ],
  },
  {
    company: "Gemini",
    feeds: ["https://blog.google/technology/ai/rss/"],
    seedUrls: [
      {
        title: "Gemini Prompting Strategies",
        url: "https://ai.google.dev/gemini-api/docs/prompting-strategies",
        category: "tutorial",
      },
      {
        title: "Gemini API Documentation",
        url: "https://ai.google.dev/gemini-api/docs",
        category: "announcement",
      },
    ],
  },
  {
    company: "Meta",
    feeds: ["https://ai.meta.com/blog/rss/"],
    seedUrls: [
      {
        title: "Meta Llama Prompting Guide",
        url: "https://www.llama.com/docs/how-to-guides/prompting/",
        category: "tutorial",
      },
      {
        title: "Meta AI Blog",
        url: "https://ai.meta.com/blog/",
        category: "news",
      },
    ],
  },
  {
    company: "Copilot",
    feeds: ["https://github.blog/tag/copilot/feed/"],
    seedUrls: [
      {
        title: "GitHub Copilot Documentation",
        url: "https://docs.github.com/en/copilot",
        category: "tutorial",
      },
      {
        title: "GitHub Copilot Prompt Engineering",
        url: "https://docs.github.com/en/copilot/using-github-copilot/prompt-engineering-for-github-copilot",
        category: "tutorial",
      },
    ],
  },
  {
    company: "NVIDIA",
    feeds: ["https://blogs.nvidia.com/feed/"],
    seedUrls: [
      {
        title: "NVIDIA AI News",
        url: "https://blogs.nvidia.com/blog/category/ai/",
        category: "news",
      },
      {
        title: "NVIDIA Developer AI Tutorials",
        url: "https://developer.nvidia.com/blog/",
        category: "tutorial",
      },
    ],
  },
  {
    company: "DeepSeek",
    feeds: ["https://api-sitemap.deepseek.com/news.xml"],
    seedUrls: [
      {
        title: "DeepSeek News",
        url: "https://www.deepseek.com/news",
        category: "announcement",
      },
      {
        title: "DeepSeek API Documentation",
        url: "https://api-docs.deepseek.com/",
        category: "tutorial",
      },
    ],
  },
  {
    company: "xAI",
    feeds: ["https://x.ai/news"],
    seedUrls: [
      {
        title: "xAI News",
        url: "https://x.ai/news",
        category: "announcement",
      },
      {
        title: "xAI Grok",
        url: "https://x.ai/grok",
        category: "product",
      },
    ],
  },
  {
    company: "Mistral",
    feeds: ["https://mistral.ai/news"],
    seedUrls: [
      {
        title: "Mistral News",
        url: "https://mistral.ai/news",
        category: "announcement",
      },
      {
        title: "Mistral Docs",
        url: "https://docs.mistral.ai/",
        category: "tutorial",
      },
    ],
  },
  {
    company: "Cohere",
    feeds: ["https://cohere.com/blog"],
    seedUrls: [
      {
        title: "Cohere Blog",
        url: "https://cohere.com/blog",
        category: "announcement",
      },
      {
        title: "Cohere Docs",
        url: "https://docs.cohere.com/",
        category: "tutorial",
      },
    ],
  },
  {
    company: "Hugging Face",
    feeds: ["https://huggingface.co/blog/feed.xml"],
    seedUrls: [
      {
        title: "Hugging Face Blog",
        url: "https://huggingface.co/blog",
        category: "research",
      },
      {
        title: "Hugging Face Papers",
        url: "https://huggingface.co/papers",
        category: "research",
      },
    ],
  },
  {
    company: "Perplexity",
    feeds: ["https://www.perplexity.ai/hub/blog"],
    seedUrls: [
      {
        title: "Perplexity Blog",
        url: "https://www.perplexity.ai/hub/blog",
        category: "announcement",
      },
      {
        title: "Perplexity Discover",
        url: "https://www.perplexity.ai/discover",
        category: "news",
      },
    ],
  },
  {
    company: "AWS Bedrock",
    feeds: ["https://aws.amazon.com/blogs/machine-learning/feed/"],
    seedUrls: [
      {
        title: "Amazon Bedrock Documentation",
        url: "https://docs.aws.amazon.com/bedrock/",
        category: "tutorial",
      },
      {
        title: "AWS Machine Learning Blog",
        url: "https://aws.amazon.com/blogs/machine-learning/",
        category: "news",
      },
    ],
  },
  {
    company: "OpenAI",
    feeds: ["https://openai.com/news/rss.xml"],
    seedUrls: [
      {
        title: "OpenAI Prompt Engineering Guide",
        url: "https://platform.openai.com/docs/guides/prompt-engineering",
        category: "tutorial",
      },
      {
        title: "OpenAI News",
        url: "https://openai.com/news",
        category: "announcement",
      },
    ],
  },
  {
    company: "Microsoft",
    feeds: ["https://devblogs.microsoft.com/azure-sdk/feed/"],
    seedUrls: [
      {
        title: "Azure OpenAI Prompt Engineering",
        url: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/prompt-engineering",
        category: "tutorial",
      },
      {
        title: "Azure AI Foundry Agents",
        url: "https://learn.microsoft.com/en-us/azure/ai-studio/concepts/agents",
        category: "announcement",
      },
    ],
  },
];

const keywordStopwords = new Set([
  "the", "and", "for", "with", "that", "from", "this", "your", "you", "are", "into", "about", "their", "will", "new", "latest", "using", "use", "how", "what", "when", "where", "why", "can", "has", "have", "its", "our", "out", "all", "more", "than", "was", "were", "not", "but", "they", "them", "also", "get", "just", "over", "into", "via", "guide", "blog", "post", "announcement", "research", "article", "news", "tutorial", "company", "learn", "docs", "documentation"
]);

const trackingParams = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "ref_src",
  "igshid",
]);

function canonicalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(String(rawUrl || "").trim());
    url.hash = "";
    for (const key of Array.from(url.searchParams.keys())) {
      if (trackingParams.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }
    let normalized = url.toString();
    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return String(rawUrl || "").trim();
  }
}

function toEpochMs(value?: string | null): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildGoogleNewsFeed(query: string): string {
  const q = encodeURIComponent(String(query || "").trim() + " when:7d");
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
}

function buildProviderDiscoveryFeeds(company: string): string[] {
  const c = String(company || "").trim();
  const baseQueries = [
    `${c} AI tutorial`,
    `${c} prompt engineering guide`,
    `${c} API docs`,
    `${c} AI course workshop`,
    `${c} agents best practices`,
  ];
  return baseQueries.map(buildGoogleNewsFeed);
}

function buildGlobalDiscoveryFeeds(): string[] {
  const queries = [
    "AI prompt engineering tutorial hands-on guide",
    "LLM agents tutorial architecture best practices",
    "OpenAI Anthropic Gemini prompt engineering docs tutorial",
    "Azure AI Foundry AWS Bedrock Vertex AI tutorial learning path",
    "Hugging Face transformers course fine-tuning tutorial",
    "RAG tutorial vector database implementation walkthrough",
    "LLM evaluation guardrails red teaming tutorial",
  ];
  return queries.map(buildGoogleNewsFeed);
}

const educationKeywords = [
  "tutorial",
  "how to",
  "guide",
  "walkthrough",
  "course",
  "learning path",
  "workshop",
  "lesson",
  "documentation",
  "docs",
  "cookbook",
  "best practices",
  "hands-on",
  "example",
  "quickstart",
];

const educationDomainSignals = [
  "docs.",
  "learn.",
  "developer.",
  "developers.",
  "academy",
  "training",
  "course",
  "tutorial",
  "education",
];

function scoreEducationalPriority(candidate: NewsCandidate): number {
  const title = String(candidate.title || "").toLowerCase();
  const preview = String(candidate.previewText || "").toLowerCase();
  const category = String(candidate.category || "").toLowerCase();
  const url = String(candidate.url || "").toLowerCase();
  const sourceFeed = String(candidate.sourceFeed || "").toLowerCase();

  let score = 0;

  if (category === "tutorial" || category === "learning" || category === "training") score += 90;
  else if (category === "research") score += 45;
  else if (category === "announcement") score += 10;

  if (sourceFeed === "seed") score += 35;

  for (const kw of educationKeywords) {
    if (title.includes(kw)) score += 18;
    if (preview.includes(kw)) score += 8;
  }

  for (const signal of educationDomainSignals) {
    if (url.includes(signal)) score += 14;
    if (sourceFeed.includes(signal)) score += 6;
  }

  return score;
}

function buildTimelineWindows(preferRecentDays: number): number[] {
  const defaults = [7, 15, 30, 60, 90, 120, 180, 265, 365];
  const clamped = Math.min(Math.max(Number(preferRecentDays || 45), 1), 365);
  const list = defaults.filter((d) => d <= clamped);
  if (!list.includes(clamped)) list.push(clamped);
  if (!list.includes(365)) list.push(365);
  return Array.from(new Set(list)).sort((a, b) => a - b);
}

function parseSitemapItems(xml: string, company: string, sourceFeed: string): NewsCandidate[] {
  const items: NewsCandidate[] = [];
  const urlRegex = /<url[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?(?:<lastmod>([\s\S]*?)<\/lastmod>)?[\s\S]*?<\/url>/gi;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(xml)) !== null) {
    const loc = decodeEntities(stripTags(match[1] || ""));
    const lastmod = decodeEntities(stripTags(match[2] || ""));
    if (!loc || !loc.startsWith("http")) continue;
    const derivedTitle = loc
      .split("/")
      .filter(Boolean)
      .slice(-1)[0]
      ?.replace(/[-_]+/g, " ")
      ?.replace(/\.[a-z0-9]+$/i, "")
      ?.trim() || "Sitemap discovery";

    items.push({
      company,
      title: derivedTitle,
      url: loc,
      publishedAt: lastmod || null,
      sourceFeed,
      category: inferCategory(derivedTitle),
    });
  }
  return items;
}

function stripTags(value: string): string {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value: string): string {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

async function fetchText(url: string, timeoutMs = 12000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "PromptCoachNewsBot/1.0",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html",
      },
    });
    if (!response.ok) return "";
    return await response.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function parseRssItems(xml: string, company: string, sourceFeed: string): NewsCandidate[] {
  const items: NewsCandidate[] = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const titleRegex = /<title>([\s\S]*?)<\/title>/i;
  const linkRegex = /<link>([\s\S]*?)<\/link>/i;
  const dateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/i;
  const descRegex = /<description>([\s\S]*?)<\/description>/i;

  const rawItems = xml.match(itemRegex) || [];
  for (const raw of rawItems) {
    const title = decodeEntities(stripTags(raw.match(titleRegex)?.[1] || ""));
    const link = decodeEntities(stripTags(raw.match(linkRegex)?.[1] || ""));
    const pub = decodeEntities(stripTags(raw.match(dateRegex)?.[1] || ""));
    const desc = decodeEntities(stripTags(raw.match(descRegex)?.[1] || ""));
    if (!title || !link) continue;
    items.push({
      company,
      title,
      url: link,
      publishedAt: pub || null,
      sourceFeed,
      previewText: desc,
      category: inferCategory(title),
    });
  }
  return items;
}

function parseAtomItems(xml: string, company: string, sourceFeed: string): NewsCandidate[] {
  const items: NewsCandidate[] = [];
  const entryRegex = /<entry[\s\S]*?<\/entry>/gi;
  const titleRegex = /<title[^>]*>([\s\S]*?)<\/title>/i;
  const updatedRegex = /<updated>([\s\S]*?)<\/updated>/i;
  const summaryRegex = /<(summary|content)[^>]*>([\s\S]*?)<\/(summary|content)>/i;

  const rawItems = xml.match(entryRegex) || [];
  for (const raw of rawItems) {
    const title = decodeEntities(stripTags(raw.match(titleRegex)?.[1] || ""));
    const pub = decodeEntities(stripTags(raw.match(updatedRegex)?.[1] || ""));
    const summary = decodeEntities(stripTags(raw.match(summaryRegex)?.[2] || ""));

    let link = "";
    const linkHrefMatch = raw.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
    if (linkHrefMatch?.[1]) {
      link = decodeEntities(linkHrefMatch[1]);
    }

    if (!title || !link) continue;
    items.push({
      company,
      title,
      url: link,
      publishedAt: pub || null,
      sourceFeed,
      previewText: summary,
      category: inferCategory(title),
    });
  }
  return items;
}

function inferCategory(title: string): string {
  const t = String(title || "").toLowerCase();
  if (/training|course|certification|bootcamp|workshop/.test(t)) return "training";
  if (/learning|learn|learning path|skill|academy/.test(t)) return "learning";
  if (/tutorial|how to|guide|playbook|walkthrough/.test(t)) return "tutorial";
  if (/paper|arxiv|research|study|benchmark/.test(t)) return "research";
  if (/announce|launch|release|introducing|availability/.test(t)) return "announcement";
  return "news";
}

function extractKeywords(text: string, max = 20): string[] {
  const words = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && w.length < 28 && !keywordStopwords.has(w) && !/^\d+$/.test(w));

  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
}

async function validateAndEnrich(candidate: NewsCandidate): Promise<ValidatedNews> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(candidate.url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "PromptCoachNewsBot/1.0",
        Accept: "text/html, application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return {
        ...candidate,
        validated: false,
        summary: candidate.previewText || "URL could not be validated.",
        keywords: extractKeywords(candidate.title + " " + (candidate.previewText || ""), 10),
      };
    }

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    const body = contentType.includes("text/html") ? await response.text() : "";
    const truncated = body.slice(0, 200000);

    const titleMatch = truncated.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descMatch = truncated.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);

    const parsedTitle = decodeEntities(stripTags(titleMatch?.[1] || "")).trim();
    const parsedDesc = decodeEntities(stripTags(descMatch?.[1] || "")).trim();

    const finalTitle = parsedTitle || candidate.title;
    const summary = (parsedDesc || candidate.previewText || "Latest validated update from " + candidate.company + ".").slice(0, 600);
    const keywords = extractKeywords([finalTitle, summary, candidate.company, candidate.category || ""].join(" "));

    return {
      ...candidate,
      title: finalTitle,
      validated: true,
      summary,
      keywords,
    };
  } catch {
    return {
      ...candidate,
      validated: false,
      summary: candidate.previewText || "URL could not be validated.",
      keywords: extractKeywords(candidate.title + " " + (candidate.previewText || ""), 10),
    };
  } finally {
    clearTimeout(timer);
  }
}

export type NewsCardRow = {
  id: number;
  company: string;
  title: string;
  url: string;
  validated: number;
  category: string;
  summary: string | null;
  keywords: string;
  published_at: string | null;
  last_checked_at: string;
  source_feed: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchAndStoreNews(db: Database, options: NewsRefreshOptions = {}) {
  const perFeedLimit = Math.min(Math.max(Number(options.perFeedLimit || 120), 10), 500);
  const maxCandidates = Math.min(Math.max(Number(options.maxCandidates || 700), 50), 2000);
  const includeSeedUrls = options.includeSeedUrls !== false;
  const includeGoogleNews = options.includeGoogleNews !== false;
  const preferRecentDays = Math.min(Math.max(Number(options.preferRecentDays || 45), 1), 365);
  const timelineWindows = buildTimelineWindows(preferRecentDays);
  let timelineDaysUsed = timelineWindows[0] || preferRecentDays;

  // ── 1. Load current URL state from DB ─────────────────────────────────────
  const existingRows = (await db.all(
    "SELECT url, validated FROM news_cards"
  )) as { url: string; validated: number }[];

  const validatedUrls = new Set(existingRows.filter((r) => r.validated).map((r) => canonicalizeUrl(r.url)));
  const failedUrls = new Set(existingRows.filter((r) => !r.validated).map((r) => canonicalizeUrl(r.url)));
  const allKnownUrls = new Set(existingRows.map((r) => canonicalizeUrl(r.url)));

  // ── 2. Build candidate list: only new URLs + previously-failed retries ─────
  const candidateMap = new Map<string, NewsCandidate>();

  for (const provider of providers) {
    // Seed URLs: keep optional, skip if already validated
    if (includeSeedUrls) {
      for (const seed of provider.seedUrls) {
        const normalizedSeedUrl = canonicalizeUrl(seed.url);
        if (validatedUrls.has(normalizedSeedUrl)) continue;
        candidateMap.set(normalizedSeedUrl, {
          company: provider.company,
          title: seed.title,
          url: normalizedSeedUrl,
          category: seed.category || inferCategory(seed.title),
          sourceFeed: "seed",
        });
      }
    }

    // RSS/Atom/Sitemap feeds: only new URLs + previously-failed ones
    const providerFeeds = includeGoogleNews
      ? provider.feeds.concat(buildProviderDiscoveryFeeds(provider.company))
      : provider.feeds.slice();

    for (const feedUrl of providerFeeds) {
      const xml = await fetchText(feedUrl);
      if (!xml) continue;

      const parsed = xml.includes("<urlset")
        ? parseSitemapItems(xml, provider.company, feedUrl)
        : xml.includes("<entry")
          ? parseAtomItems(xml, provider.company, feedUrl)
          : parseRssItems(xml, provider.company, feedUrl);

      const sortedByNewest = parsed
        .filter((item) => String(item.url || "").startsWith("http"))
        .sort((a, b) => toEpochMs(b.publishedAt || null) - toEpochMs(a.publishedAt || null));

      let addedForFeed = 0;
      for (const windowDays of timelineWindows) {
        const cutoffMs = Date.now() - windowDays * 24 * 60 * 60 * 1000;
        for (const item of sortedByNewest) {
          if (addedForFeed >= perFeedLimit || candidateMap.size >= maxCandidates) break;
          const normalizedItemUrl = canonicalizeUrl(item.url);
          if (!normalizedItemUrl.startsWith("http")) continue;
          if (candidateMap.has(normalizedItemUrl) || validatedUrls.has(normalizedItemUrl)) continue;

          const publishedMs = toEpochMs(item.publishedAt || null);
          if (publishedMs !== 0 && publishedMs < cutoffMs) continue;

          candidateMap.set(normalizedItemUrl, {
            ...item,
            url: normalizedItemUrl,
          });
          addedForFeed += 1;
          if (windowDays > timelineDaysUsed) timelineDaysUsed = windowDays;
        }
        if (addedForFeed >= perFeedLimit || candidateMap.size >= maxCandidates) break;
      }
      if (candidateMap.size >= maxCandidates) break;
    }
    if (candidateMap.size >= maxCandidates) break;
  }

  // Global discovery queries to improve new-article coverage across AI ecosystem
  if (candidateMap.size < maxCandidates && includeGoogleNews) {
    for (const feedUrl of buildGlobalDiscoveryFeeds()) {
      const xml = await fetchText(feedUrl);
      if (!xml) continue;
      const parsed = xml.includes("<entry")
        ? parseAtomItems(xml, "AI Industry", feedUrl)
        : parseRssItems(xml, "AI Industry", feedUrl);

      const sortedByNewest = parsed
        .filter((item) => String(item.url || "").startsWith("http"))
        .sort((a, b) => toEpochMs(b.publishedAt || null) - toEpochMs(a.publishedAt || null));

      let addedForFeed = 0;
      for (const windowDays of timelineWindows) {
        const cutoffMs = Date.now() - windowDays * 24 * 60 * 60 * 1000;
        for (const item of sortedByNewest) {
          if (addedForFeed >= perFeedLimit || candidateMap.size >= maxCandidates) break;
          const normalizedItemUrl = canonicalizeUrl(item.url);
          if (!normalizedItemUrl.startsWith("http")) continue;
          if (candidateMap.has(normalizedItemUrl) || validatedUrls.has(normalizedItemUrl)) continue;

          const publishedMs = toEpochMs(item.publishedAt || null);
          if (publishedMs !== 0 && publishedMs < cutoffMs) continue;

          candidateMap.set(normalizedItemUrl, {
            ...item,
            url: normalizedItemUrl,
          });
          addedForFeed += 1;
          if (windowDays > timelineDaysUsed) timelineDaysUsed = windowDays;
        }
        if (addedForFeed >= perFeedLimit || candidateMap.size >= maxCandidates) break;
      }
      if (candidateMap.size >= maxCandidates) break;
    }
  }

  // ── 3. Validate and store only the candidates ──────────────────────────────
  const results: ValidatedNews[] = [];
  let insertedCount = 0;
  let updatedCount = 0;

  const orderedCandidates = Array.from(candidateMap.values()).sort((a, b) => {
    const educationalDelta = scoreEducationalPriority(b) - scoreEducationalPriority(a);
    if (educationalDelta !== 0) return educationalDelta;
    return toEpochMs(b.publishedAt || null) - toEpochMs(a.publishedAt || null);
  });

  for (const candidate of orderedCandidates) {
    const result = await validateAndEnrich(candidate);
    results.push(result);

    const normalizedResultUrl = canonicalizeUrl(result.url);
    const isNew = !allKnownUrls.has(normalizedResultUrl);
    const isRetry = failedUrls.has(normalizedResultUrl);

    if (isNew) {
      // New URL: insert (ignore if somehow a race created it already)
      await db.run(
        `INSERT OR IGNORE INTO news_cards
          (company, title, url, validated, category, summary, keywords, published_at, source_feed, last_checked_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        result.company,
        result.title,
        normalizedResultUrl,
        result.validated ? 1 : 0,
        result.category || inferCategory(result.title),
        result.summary,
        JSON.stringify(result.keywords || []),
        result.publishedAt || null,
        result.sourceFeed || null
      );
      insertedCount++;
      allKnownUrls.add(normalizedResultUrl);
    } else if (isRetry) {
      // Previously failed: update with new validation attempt result
      await db.run(
        `UPDATE news_cards SET
          validated = ?, category = ?, summary = ?, keywords = ?,
          published_at = COALESCE(?, published_at),
          last_checked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE url = ?`,
        result.validated ? 1 : 0,
        result.category || inferCategory(result.title),
        result.summary,
        JSON.stringify(result.keywords || []),
        result.publishedAt || null,
        normalizedResultUrl
      );
      updatedCount++;
    }
  }

  return {
    fetched: orderedCandidates.length,
    stored: insertedCount,
    updated: updatedCount,
    validated: results.filter((v) => v.validated).length,
    skipped: validatedUrls.size,
    perFeedLimit,
    maxCandidates,
    includeGoogleNews,
    preferRecentDays,
    timelineDaysUsed,
  };
}

export function parseKeywordsColumn(value: string): string[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.map((k) => String(k).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function buildKeywordCloud(rows: NewsCardRow[]) {
  const cloud: Record<string, number> = {};
  for (const row of rows) {
    const keywords = parseKeywordsColumn(row.keywords);
    for (const kw of keywords) {
      cloud[kw] = (cloud[kw] || 0) + 1;
    }
  }
  return cloud;
}

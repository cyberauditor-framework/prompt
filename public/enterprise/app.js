(function () {
  const body = document.body;
  const sidebar = document.getElementById("sidebar");
  const toggleButton = document.getElementById("drawer-toggle");
  const backdrop = document.getElementById("drawer-backdrop");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const statusText = document.getElementById("status-text");
  const metaText = document.getElementById("meta-text");
  const refreshBtn = document.getElementById("refresh-btn");
  const validateBtn = document.getElementById("validate-btn");
  const deployBtn = document.getElementById("deploy-btn");
  const form = document.getElementById("llm-studio-form");
  const stateBadge = document.getElementById("llm-studio-state");
  const feedback = document.getElementById("llm-studio-feedback");
  const testConnectionBtn = document.getElementById("test-connection-btn");
  const resetSettingsBtn = document.getElementById("reset-settings-btn");
  const fetchModelsBtn = document.getElementById("fetch-models-btn");
  const modelDatalist = document.getElementById("llm-model-list");
  const settingsPanel = document.getElementById("settings-panel");
  const storageKey = "prompt-coach.llmStudioSettings";
  const availabilityNode = document.getElementById("status-availability");
  const activeAgentsNode = document.getElementById("status-active-agents");
  const pendingReviewsNode = document.getElementById("status-pending-reviews");
  const healthApiStatusNode = document.getElementById("health-api-status");
  const healthApiUptimeNode = document.getElementById("health-api-uptime");
  const healthDbStatusNode = document.getElementById("health-db-status");
  const healthDbCountsNode = document.getElementById("health-db-counts");
  const healthLlmStatusNode = document.getElementById("health-llm-status");
  const healthLlmEndpointNode = document.getElementById("health-llm-endpoint");
  const healthEndpointsListNode = document.getElementById("health-endpoints-list");
  const healthDatabasesListNode = document.getElementById("health-databases-list");
  const healthLastRefreshNode = document.getElementById("health-last-refresh");
  const logsConsoleNode = document.getElementById("logs-console");
  const logsReviewNode = document.getElementById("logs-review");
  const logsSummaryNode = document.getElementById("logs-summary");
  const logsLevelFilterNode = document.getElementById("logs-level-filter");
  const refreshLogsBtn = document.getElementById("refresh-logs-btn");
  const clearLogsViewBtn = document.getElementById("clear-logs-view-btn");

  if (!sidebar || !toggleButton || !backdrop || !statusText || !metaText) {
    return;
  }

  let lastFocused = null;

  function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function updateStatus(message) {
    const stamp = new Date().toLocaleTimeString();
    statusText.textContent = "Status: " + message;
    metaText.textContent = "Last update " + stamp;
    void sendEventLog({
      level: "info",
      category: "user_status",
      message: "Status updated",
      component: "client",
      userContext: "enterprise",
      details: { message, stamp },
    });
  }

  function titleCaseSection(section) {
    return String(section || "section")
      .split("-")
      .map(function (part) {
        return part ? part.charAt(0).toUpperCase() + part.slice(1) : "";
      })
      .join(" ");
  }

  function setDrawerState(open) {
    const shouldOpen = Boolean(open && isMobile());

    body.classList.toggle("drawer-open", shouldOpen);
    sidebar.setAttribute("aria-hidden", shouldOpen ? "false" : String(isMobile()));
    toggleButton.setAttribute("aria-expanded", String(shouldOpen));

    if (shouldOpen) {
      lastFocused = document.activeElement;
      const firstLink = navLinks[0];
      if (firstLink) {
        firstLink.focus();
      }
    } else if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
      lastFocused = null;
    }
  }

  function closeDrawer() {
    setDrawerState(false);
  }

  const allPanels = [
    document.getElementById("overview-panel"),
    document.getElementById("status-panel"),
    settingsPanel,
  ].filter(Boolean);

  function getPanelForSection(section) {
    if (section === "settings") return settingsPanel;
    if (section === "overview") return document.getElementById("overview-panel");
    if (section === "logs") return document.getElementById("status-panel");
    return null;
  }

  function showSection(section) {
    const isSettings = section === "settings";

    // Settings is a full-page swap; other sections show the overview+status panels
    allPanels.forEach(function (panel) {
      if (panel.id === "settings-panel") {
        panel.hidden = !isSettings;
      } else {
        panel.hidden = isSettings;
      }
    });

    const target = getPanelForSection(section);
    if (target) {
      if (!isSettings) target.scrollIntoView({ behavior: "smooth", block: "start" });
      const focusTarget = target.querySelector("input, textarea, button, h2");
      if (focusTarget && typeof focusTarget.focus === "function") {
        focusTarget.focus({ preventScroll: true });
      }
    }
  }

  toggleButton.addEventListener("click", function () {
    const open = body.classList.contains("drawer-open");
    setDrawerState(!open);
  });

  backdrop.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && body.classList.contains("drawer-open")) {
      closeDrawer();
    }
  });

  navLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      navLinks.forEach(function (candidate) {
        candidate.classList.remove("is-active");
      });
      link.classList.add("is-active");

      const section = link.dataset.section || "section";
      updateStatus("Viewing " + titleCaseSection(section));

      const href = link.getAttribute("href") || "#";
      if (href === "#") {
        event.preventDefault();
        // (help-library handled by showSection like any other panel)
        showSection(section);
        if (section === "logs") {
          void loadEventLogs();
        }
        closeDrawer();
        return;
      }

      if (body.classList.contains("drawer-open")) {
        closeDrawer();
      }
    });
  });

  function bindAction(button, actionName) {
    if (!button) {
      return;
    }
    button.addEventListener("click", function () {
      updateStatus(actionName + " completed");
    });
  }

  function defaultSettings() {
    return {
      baseUrl: "http://localhost:1234/v1",
      model: "qwen2.5-7b-instruct",
      apiKey: "",
      timeout: "30000",
      systemPrompt: "You are an enterprise prompt engineering assistant.",
      healthCheck: true,
      saveLocal: true,
    };
  }

  function readFormSettings() {
    if (!form) {
      return defaultSettings();
    }

    const formData = new FormData(form);
    return {
      baseUrl: String(formData.get("baseUrl") || "").trim(),
      model: String(formData.get("model") || "").trim(),
      apiKey: String(formData.get("apiKey") || ""),
      timeout: String(formData.get("timeout") || "30000").trim(),
      systemPrompt: String(formData.get("systemPrompt") || "").trim(),
      healthCheck: formData.get("healthCheck") === "on",
      saveLocal: formData.get("saveLocal") === "on",
    };
  }

  function writeFormSettings(settings) {
    if (!form) {
      return;
    }

    form.elements.baseUrl.value = settings.baseUrl;
    form.elements.model.value = settings.model;
    form.elements.apiKey.value = settings.apiKey;
    form.elements.timeout.value = settings.timeout;
    form.elements.systemPrompt.value = settings.systemPrompt;
    form.elements.healthCheck.checked = settings.healthCheck;
    form.elements.saveLocal.checked = settings.saveLocal;
  }

  function setFeedback(message, tone) {
    if (!feedback) {
      return;
    }

    feedback.textContent = message;
    feedback.dataset.tone = tone || "neutral";
  }

  function updateStateBadge(settings) {
    if (!stateBadge) {
      return;
    }

    const configured = Boolean(settings.baseUrl && settings.model);
    stateBadge.textContent = configured ? "Configured" : "Not configured";
    stateBadge.dataset.state = configured ? "configured" : "idle";
  }

  function loadSettings() {
    const fallback = defaultSettings();
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) {
        return fallback;
      }
      return { ...fallback, ...JSON.parse(saved) };
    } catch {
      return fallback;
    }
  }

  function saveSettings(settings) {
    if (!settings.saveLocal) {
      window.localStorage.removeItem(storageKey);
      updateStateBadge(settings);
      setFeedback("Settings saved for this session only.", "neutral");
      updateStatus("LLM Studio settings updated");
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(settings));
    updateStateBadge(settings);
    setFeedback("LLM Studio settings saved locally.", "success");
    updateStatus("LLM Studio settings saved");
  }

  function validateSettings(settings) {
    if (!settings.baseUrl || !/^https?:\/\//.test(settings.baseUrl)) {
      return "Enter a valid Base URL, for example http://localhost:1234/v1";
    }
    if (!settings.model) {
      return "Enter a default model name.";
    }
    if (!/^\d+$/.test(settings.timeout) || Number(settings.timeout) < 1000) {
      return "Timeout must be a number greater than or equal to 1000.";
    }
    return "";
  }

  function buildLlmEndpoint(baseUrl, route) {
    var cleanBase = String(baseUrl || "").replace(/\/$/, "");
    if (!cleanBase) return route;
    return /\/v1$/i.test(cleanBase) ? cleanBase + route : cleanBase + "/v1" + route;
  }

  function formatUptime(seconds) {
    const total = Math.max(0, Number(seconds || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h + "h " + m + "m " + s + "s";
  }

  async function sendEventLog(entry) {
    try {
      await fetch("/api/event-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
    } catch {
      // Logging should not interrupt UX flows.
    }
  }

  function formatEventLogLine(log) {
    var ts = log.created_at || new Date().toISOString();
    var base = "[" + ts + "] [" + (log.level || "info").toUpperCase() + "] [" + (log.category || "general") + "] " + (log.message || "");
    var endpoint = log.endpoint ? " | " + (log.method || "") + " " + log.endpoint : "";
    var status = log.status_code ? " | HTTP " + log.status_code : "";
    var tokenInfo = (log.tokens_in != null || log.tokens_out != null)
      ? " | tokens_in=" + (log.tokens_in ?? "-") + " tokens_out=" + (log.tokens_out ?? "-")
      : "";
    var responseType = log.response_type ? " | response_type=" + log.response_type : "";
    var details = "";
    if (log.details) {
      try {
        var parsed = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
        details = "\n  details: " + JSON.stringify(parsed);
      } catch {
        details = "\n  details: " + String(log.details);
      }
    }
    return base + endpoint + status + tokenInfo + responseType + details;
  }

  function formatReviewText(data) {
    if (!data) return "No review data available.";

    var lines = [];
    lines.push("Total logs: " + (data.totalLogs || 0));
    lines.push("Token totals: in=" + ((data.tokenTotals && data.tokenTotals.tokensIn) || 0) + " out=" + ((data.tokenTotals && data.tokenTotals.tokensOut) || 0));

    var levels = Array.isArray(data.byLevel) ? data.byLevel : [];
    lines.push("By level: " + (levels.length ? levels.map(function (r) { return r.level + "=" + r.count; }).join(", ") : "none"));

    var responseTypes = Array.isArray(data.responseTypes) ? data.responseTypes : [];
    lines.push("Response types: " + (responseTypes.length ? responseTypes.map(function (r) { return r.response_type + "=" + r.count; }).join(", ") : "none"));

    var topCategories = Array.isArray(data.topCategories) ? data.topCategories.slice(0, 8) : [];
    lines.push("Top categories:");
    if (topCategories.length) {
      topCategories.forEach(function (row) {
        lines.push("  - " + row.category + ": " + row.count);
      });
    } else {
      lines.push("  - none");
    }

    var topEndpoints = Array.isArray(data.topEndpoints) ? data.topEndpoints.slice(0, 8) : [];
    lines.push("Top endpoints:");
    if (topEndpoints.length) {
      topEndpoints.forEach(function (row) {
        lines.push("  - " + (row.method || "") + " " + (row.endpoint || "") + ": " + row.count);
      });
    } else {
      lines.push("  - none");
    }

    return lines.join("\n");
  }

  async function loadEventLogReview() {
    if (!logsReviewNode) return;
    try {
      const response = await fetch("/api/event-logs/review", { method: "GET" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      logsReviewNode.textContent = formatReviewText(data);
    } catch (error) {
      logsReviewNode.textContent = "Failed to load log review: " + (error && error.message ? error.message : "unknown error");
    }
  }

  async function loadEventLogs() {
    if (!logsConsoleNode) return;
    var level = logsLevelFilterNode ? String(logsLevelFilterNode.value || "") : "";
    var query = level ? "?level=" + encodeURIComponent(level) + "&limit=300" : "?limit=300";
    try {
      const response = await fetch("/api/event-logs" + query, { method: "GET" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      const logs = Array.isArray(data.logs) ? data.logs : [];
      if (logsSummaryNode) logsSummaryNode.textContent = "Loaded " + logs.length + " log entries.";
      logsConsoleNode.textContent = logs.length
        ? logs.map(formatEventLogLine).join("\n\n")
        : "No logs available for current filter.";
      void loadEventLogReview();
    } catch (error) {
      if (logsSummaryNode) logsSummaryNode.textContent = "Failed to load logs.";
      logsConsoleNode.textContent = "Error loading logs: " + (error && error.message ? error.message : "unknown error");
      void sendEventLog({
        level: "error",
        category: "logs_view",
        message: "Failed to load event logs",
        component: "client",
        userContext: "enterprise",
        details: { error: error && error.message ? error.message : String(error) },
      });
    }
  }

  async function checkLlmStatus(settings) {
    const base = String(settings.baseUrl || "").replace(/\/$/, "");
    const endpoint = buildLlmEndpoint(base, "/chat/completions");
    if (!base || !settings.model) {
      return {
        ok: false,
        state: "Not configured",
        detail: "Configure Base URL and model in Settings",
      };
    }

    const controller = new AbortController();
    const timeoutMs = Math.max(1000, Number(settings.timeout || 30000));
    const timeout = setTimeout(function () {
      controller.abort();
    }, Math.min(timeoutMs, 6000));

    try {
      const headers = { "Content-Type": "application/json" };
      if (settings.apiKey) headers["Authorization"] = "Bearer " + settings.apiKey;

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
          stream: false,
        }),
      });

      if (response.ok) {
        let usage = {};
        try {
          const statusJson = await response.clone().json();
          usage = statusJson && statusJson.usage ? statusJson.usage : {};
        } catch {
          usage = {};
        }
        void sendEventLog({
          level: "info",
          category: "llm_call",
          message: "LLM status probe succeeded",
          component: "client",
          endpoint: endpoint,
          method: "POST",
          statusCode: response.status,
          tokensIn: Number(usage.prompt_tokens || 0),
          tokensOut: Number(usage.completion_tokens || 0),
          responseType: "json",
          details: { model: settings.model, probe: true, usage: usage },
        });
        return {
          ok: true,
          state: "Connected",
          detail: "Model endpoint responded",
        };
      }

      if (response.status === 401 || response.status === 403) {
        void sendEventLog({
          level: "warn",
          category: "llm_call",
          message: "LLM status probe reachable but unauthorized",
          component: "client",
          endpoint: endpoint,
          method: "POST",
          statusCode: response.status,
          responseType: "json",
          details: { model: settings.model, probe: true },
        });
        return {
          ok: true,
          state: "Reachable (Auth required)",
          detail: "Endpoint reachable, credentials rejected",
        };
      }

      return {
        ok: false,
        state: "Degraded",
        detail: "HTTP " + response.status,
      };
    } catch (error) {
      void sendEventLog({
        level: "error",
        category: "llm_call",
        message: "LLM status probe failed",
        component: "client",
        endpoint: endpoint,
        method: "POST",
        details: { model: settings.model, error: error && error.message ? error.message : String(error) },
      });
      return {
        ok: false,
        state: "Disconnected",
        detail: error && error.name === "AbortError" ? "Connection timed out" : "Could not reach endpoint",
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  function renderEndpointChecks(endpoints) {
    if (!healthEndpointsListNode) return;
    const entries = Object.entries(endpoints || {});
    if (!entries.length) {
      healthEndpointsListNode.innerHTML = "<li>No endpoint data available.</li>";
      return;
    }

    healthEndpointsListNode.innerHTML = entries
      .map(function (entry) {
        const key = entry[0];
        const ok = Boolean(entry[1]);
        return "<li>" + key + ": " + (ok ? "OK" : "Fail") + "</li>";
      })
      .join("");
  }

  function renderDatabaseCatalog(systemStatus) {
    if (!healthDatabasesListNode) return;
    const entries = [];
    var knownFiles = new Set();
    const mainCatalog = systemStatus && systemStatus.database && Array.isArray(systemStatus.database.catalog)
      ? systemStatus.database.catalog
      : [];

    mainCatalog.forEach(function (entry) {
      entries.push(entry);
      var fileName = String(entry && entry.file || "").trim();
      if (fileName) knownFiles.add(fileName);
    });

    if (systemStatus && systemStatus.loggingDatabase) {
      var loggingFile = String(systemStatus.loggingDatabase.file || "prompt_logs.sqlite");
      if (knownFiles.has(loggingFile)) {
        // Already present from server catalog.
      } else {
      const logCount = Number(systemStatus.loggingDatabase.counts && systemStatus.loggingDatabase.counts.eventLogs || 0);
      entries.push({
        name: "logging",
        file: loggingFile,
        totalRecords: logCount,
        tables: { app_event_logs: logCount },
      });
      }
    }

    if (systemStatus && systemStatus.newsDatabase) {
      var newsFile = String(systemStatus.newsDatabase.file || "news.sqlite");
      if (knownFiles.has(newsFile)) {
        // Already present from server catalog.
      } else {
      const cardCount = Number(systemStatus.newsDatabase.counts && systemStatus.newsDatabase.counts.newsCards || 0);
      const articleCount = Number(systemStatus.newsDatabase.counts && systemStatus.newsDatabase.counts.newsArticles || 0);
      entries.push({
        name: "news",
        file: newsFile,
        totalRecords: cardCount + articleCount,
        tables: {
          news_cards: cardCount,
          news_articles: articleCount,
        },
      });
      }
    }

    if (!entries.length) {
      healthDatabasesListNode.innerHTML = "<li>No databases detected.</li>";
      return;
    }

    healthDatabasesListNode.innerHTML = entries
      .map(function (dbItem) {
        const name = String(dbItem.name || "unknown");
        const file = String(dbItem.file || "(memory)");
        const total = Number(dbItem.totalRecords || 0);
        const tablePairs = Object.entries(dbItem.tables || {});
        const tableText = tablePairs.length
          ? tablePairs.map(function (entry) { return entry[0] + ": " + entry[1]; }).join(" | ")
          : "No tables";

        return "<li><strong>" + name + "</strong> (" + file + ") - Records: " + total + " - " + tableText + "</li>";
      })
      .join("");
  }

  async function refreshPlatformHealth() {
    try {
      void sendEventLog({
        level: "debug",
        category: "processing_step",
        message: "Refreshing platform health",
        component: "client",
      });
      const response = await fetch("/api/system-status", { method: "GET" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();

      if (availabilityNode) {
        availabilityNode.textContent = data.ok ? "Online" : "Degraded";
      }

      const dbCounts = (data.database && data.database.counts) || {};
      if (activeAgentsNode) {
        activeAgentsNode.textContent = String(dbCounts.promptPatterns || 0);
      }
      if (pendingReviewsNode) {
        pendingReviewsNode.textContent = String(dbCounts.promptLogs || 0);
      }

      if (healthApiStatusNode) {
        healthApiStatusNode.textContent = "Status: " + (data.server && data.server.ok ? "Online" : "Offline");
      }
      if (healthApiUptimeNode) {
        healthApiUptimeNode.textContent = "Uptime: " + formatUptime(data.server && data.server.uptimeSeconds);
      }

      if (healthDbStatusNode) {
        var allDbOk = Boolean(
          data.database && data.database.ok &&
          data.loggingDatabase && data.loggingDatabase.ok &&
          data.newsDatabase && data.newsDatabase.ok
        );
        healthDbStatusNode.textContent = "Status: " + (allDbOk ? "Connected" : "Error");
      }
      if (healthDbCountsNode) {
        healthDbCountsNode.textContent =
          "Prompt Patterns: " + String(dbCounts.promptPatterns || 0) +
          " | Prompt Logs: " + String(dbCounts.promptLogs || 0) +
          " | Saved Prompts: " + String(dbCounts.savedPrompts || 0) +
          " | Event Logs: " + String(dbCounts.eventLogs || 0) +
          " | News Cards: " + String(dbCounts.newsCards || 0) +
          " | News Articles: " + String(dbCounts.newsArticles || 0);
      }

      const llmSettings = loadSettings();
      const llmState = await checkLlmStatus(llmSettings);
      if (healthLlmStatusNode) {
        healthLlmStatusNode.textContent = "Status: " + llmState.state;
      }
      if (healthLlmEndpointNode) {
        const endpoint = llmSettings.baseUrl ? llmSettings.baseUrl : "Not configured";
        healthLlmEndpointNode.textContent = "Endpoint: " + endpoint + " | " + llmState.detail;
      }

      renderEndpointChecks(data.endpoints);
      renderDatabaseCatalog(data);

      if (healthLastRefreshNode) {
        healthLastRefreshNode.textContent = "Last refresh: " + new Date().toLocaleString();
      }
      void loadEventLogs();
    } catch (error) {
      if (availabilityNode) availabilityNode.textContent = "Offline";
      if (healthApiStatusNode) healthApiStatusNode.textContent = "Status: Unreachable";
      if (healthApiUptimeNode) healthApiUptimeNode.textContent = "Uptime: --";
      if (healthDbStatusNode) healthDbStatusNode.textContent = "Status: Unknown";
      if (healthDbCountsNode) healthDbCountsNode.textContent = "Prompt Patterns: -- | Prompt Logs: -- | Saved Prompts: -- | Event Logs: -- | News Cards: -- | News Articles: --";
      if (healthLlmStatusNode) healthLlmStatusNode.textContent = "Status: Unknown";
      if (healthLlmEndpointNode) healthLlmEndpointNode.textContent = "Endpoint: --";
      if (healthEndpointsListNode) healthEndpointsListNode.innerHTML = "<li>Endpoint checks unavailable.</li>";
      if (healthDatabasesListNode) healthDatabasesListNode.innerHTML = "<li>Database catalog unavailable.</li>";
      if (healthLastRefreshNode) {
        healthLastRefreshNode.textContent = "Last refresh failed: " + new Date().toLocaleString();
      }
      void sendEventLog({
        level: "error",
        category: "processing_step",
        message: "Platform health refresh failed",
        component: "client",
        details: { error: error && error.message ? error.message : String(error) },
      });
    }
  }

  async function fetchModels() {
    function extractModelIds(payload) {
      if (!payload || typeof payload !== "object") return [];

      var candidates = [];
      if (Array.isArray(payload.data)) candidates.push(payload.data);
      if (Array.isArray(payload.models)) candidates.push(payload.models);
      if (Array.isArray(payload.items)) candidates.push(payload.items);
      if (Array.isArray(payload.model_list)) candidates.push(payload.model_list);
      if (Array.isArray(payload.available_models)) candidates.push(payload.available_models);
      if (payload.result && Array.isArray(payload.result.models)) candidates.push(payload.result.models);
      if (payload.result && Array.isArray(payload.result.data)) candidates.push(payload.result.data);

      var ids = [];
      candidates.forEach(function (list) {
        list.forEach(function (item) {
          if (typeof item === "string") {
            ids.push(item);
            return;
          }
          if (item && typeof item === "object") {
            var id = item.id || item.name || item.model || item.value;
            if (typeof id === "string" && id.trim()) {
              ids.push(id.trim());
            }
          }
        });
      });

      return Array.from(new Set(ids));
    }

    const settings = readFormSettings();
    const configuredBase = String(settings.baseUrl || "").trim();
    const modelEndpoint = "/api/v1/models" + (configuredBase ? "?baseUrl=" + encodeURIComponent(configuredBase) : "");

    setFeedback("Fetching model list from LLM Studio...", "neutral");
    if (fetchModelsBtn) fetchModelsBtn.disabled = true;

    try {
      void sendEventLog({
        level: "info",
        category: "llm_call",
        message: "Fetching LLM models",
        component: "client",
        endpoint: modelEndpoint,
        method: "GET",
        details: { query: "list models", configuredBaseUrl: settings.baseUrl || null },
      });
      const headers = {};
      if (settings.apiKey) headers["Authorization"] = "Bearer " + settings.apiKey;

      const response = await fetch(modelEndpoint, { method: "GET", headers });
      const responseText = await response.text();
      const contentType = String(response.headers.get("content-type") || "");

      if (!response.ok) {
        throw new Error("HTTP " + response.status + (responseText ? ": " + responseText.slice(0, 180) : ""));
      }

      if (!contentType.includes("application/json")) {
        throw new Error("Expected JSON but received " + (contentType || "unknown content type"));
      }

      let json;
      try {
        json = JSON.parse(responseText);
      } catch {
        throw new Error("Invalid JSON response from /api/v1/models");
      }

      const models = extractModelIds(json);

      if (!models.length) {
        var apiError = (json && (json.error?.message || json.error || json.message)) || "No models found in response";
        throw new Error(String(apiError));
      }

      if (modelDatalist) {
        modelDatalist.innerHTML = models
          .map(function (id) { return "<option value=\"" + id + "\"></option>"; })
          .join("");
      }

      // Pre-select first model if field is empty or its current value isn't in the fetched list
      const modelInput = document.getElementById("llm-model");
      if (modelInput && (!modelInput.value || !models.includes(modelInput.value))) {
        modelInput.value = models[0];
      }

      setFeedback("Loaded " + models.length + " model" + (models.length === 1 ? "" : "s") + " from LLM Studio.", "success");
      void sendEventLog({
        level: "info",
        category: "llm_call",
        message: "Fetched LLM models",
        component: "client",
        endpoint: modelEndpoint,
        method: "GET",
        statusCode: response.status,
        details: { count: models.length },
      });
    } catch (err) {
      var fetchErrMsg = err && err.message ? err.message : "unknown error";
      setFeedback("Could not fetch models: " + fetchErrMsg, "error");
      void sendEventLog({
        level: "error",
        category: "llm_call",
        message: "Failed fetching LLM models",
        component: "client",
        endpoint: modelEndpoint,
        method: "GET",
        details: { error: err && err.message ? err.message : String(err) },
      });
    } finally {
      if (fetchModelsBtn) fetchModelsBtn.disabled = false;
    }
  }

  async function testConnection() {
    const settings = readFormSettings();
    const problem = validateSettings(settings);
    if (problem) {
      setFeedback(problem, "error");
      updateStatus("LLM Studio settings need attention");
      return;
    }

    const base = settings.baseUrl.replace(/\/$/, "");
    const endpoint = buildLlmEndpoint(base, "/chat/completions");
    setFeedback("Testing LLM Studio connection...", "neutral");

    try {
      const headers = { "Content-Type": "application/json" };
      if (settings.apiKey) headers["Authorization"] = "Bearer " + settings.apiKey;

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
          stream: false,
        }),
      });

      // 2xx or 4xx auth errors still confirm the server is reachable
      if (response.ok || response.status === 401 || response.status === 403) {
        let usage = {};
        try {
          const connectionJson = await response.clone().json();
          usage = connectionJson && connectionJson.usage ? connectionJson.usage : {};
        } catch {
          usage = {};
        }
        setFeedback("Connection succeeded. LLM Studio is reachable.", "success");
        updateStatus("LLM Studio connection verified");
        void sendEventLog({
          level: "info",
          category: "llm_call",
          message: "LLM connection test completed",
          component: "client",
          endpoint,
          method: "POST",
          statusCode: response.status,
          tokensIn: Number(usage.prompt_tokens || 0),
          tokensOut: Number(usage.completion_tokens || 0),
          responseType: "json",
          details: { model: settings.model, usage: usage },
        });
      } else {
        throw new Error("HTTP " + response.status);
      }
    } catch (error) {
      setFeedback(
        "Connection test failed. Confirm LLM Studio is running and CORS is enabled.",
        "error"
      );
      updateStatus("LLM Studio connection failed");
      void sendEventLog({
        level: "error",
        category: "llm_call",
        message: "LLM connection test failed",
        component: "client",
        endpoint,
        method: "POST",
        details: { error: error && error.message ? error.message : String(error) },
      });
    }
  }

  bindAction(validateBtn, "Validation");
  bindAction(deployBtn, "Deploy");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async function () {
      if (refreshBtn.disabled) return;
      var originalText = refreshBtn.textContent;
      refreshBtn.disabled = true;
      refreshBtn.textContent = "Refreshing...";

      if (healthApiStatusNode) healthApiStatusNode.textContent = "Status: Refreshing...";
      if (healthDbStatusNode) healthDbStatusNode.textContent = "Status: Refreshing...";
      if (healthLlmStatusNode) healthLlmStatusNode.textContent = "Status: Refreshing...";
      if (healthLastRefreshNode) healthLastRefreshNode.textContent = "Last refresh: in progress...";

      try {
        await refreshPlatformHealth();
        updateStatus("Overview data refreshed");
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = originalText || "Refresh";
      }
    });
  }

  if (validateBtn) {
    validateBtn.addEventListener("click", function () {
      void refreshPlatformHealth();
    });
  }

  if (form) {
    const initialSettings = loadSettings();
    writeFormSettings(initialSettings);
    updateStateBadge(initialSettings);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const settings = readFormSettings();
      const problem = validateSettings(settings);
      if (problem) {
        setFeedback(problem, "error");
        updateStatus("LLM Studio settings need attention");
        return;
      }

      saveSettings(settings);
    });
  }

  if (fetchModelsBtn) {
    fetchModelsBtn.addEventListener("click", function () {
      void fetchModels();
    });
  }

  if (testConnectionBtn) {
    testConnectionBtn.addEventListener("click", function () {
      void testConnection();
    });
  }

  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener("click", function () {
      const settings = defaultSettings();
      if (form) {
        writeFormSettings(settings);
      }
      window.localStorage.removeItem(storageKey);
      updateStateBadge(settings);
      setFeedback("LLM Studio settings reset to defaults.", "neutral");
      updateStatus("LLM Studio settings reset");
    });
  }

  if (refreshLogsBtn) {
    refreshLogsBtn.addEventListener("click", function () {
      void loadEventLogs();
      void loadEventLogReview();
    });
  }

  if (logsLevelFilterNode) {
    logsLevelFilterNode.addEventListener("change", function () {
      void loadEventLogs();
    });
  }

  if (clearLogsViewBtn && logsConsoleNode) {
    clearLogsViewBtn.addEventListener("click", function () {
      logsConsoleNode.textContent = "Cleared local view.";
      if (logsSummaryNode) logsSummaryNode.textContent = "Logs view cleared. Data still stored in database.";
    });
  }

  window.addEventListener("resize", function () {
    if (!isMobile()) {
      body.classList.remove("drawer-open");
      sidebar.setAttribute("aria-hidden", "false");
      toggleButton.setAttribute("aria-expanded", "false");
      backdrop.hidden = true;
    } else {
      sidebar.setAttribute("aria-hidden", body.classList.contains("drawer-open") ? "false" : "true");
      backdrop.hidden = false;
    }
  });

  if (isMobile()) {
    sidebar.setAttribute("aria-hidden", "true");
    backdrop.hidden = false;
  }

  void refreshPlatformHealth();
  void loadEventLogs();
  void loadEventLogReview();
  window.setInterval(function () {
    void refreshPlatformHealth();
  }, 30000);

  updateStatus("Ready");

  // ── Prompt Library ─────────────────────────────────────────────────────────

  (function initPromptLibrary() {
    var libPanel = document.getElementById("prompt-library-panel");
    if (!libPanel) return;

    // Register prompt-library section in the routing
    allPanels.push(libPanel);

    var _origGetPanel = getPanelForSection;

    // Patch showSection to support prompt-library and future <section>-panel pages.
    showSection = function (section) {
      var dynamicPanel = document.getElementById(section + "-panel");
      var target = dynamicPanel || _origGetPanel(section);
      var allMainPanels = Array.from(document.querySelectorAll(".app-main .main-card[id$='-panel']"));

      if (target) {
        allMainPanels.forEach(function (panel) {
          panel.hidden = panel !== target;
        });
      } else {
        // Fallback for sections without dedicated panels.
        allMainPanels.forEach(function (panel) {
          panel.hidden = panel.id === "settings-panel" || panel.id === "prompt-library-panel";
        });
      }

      if (target && target.id === "prompt-library-panel") {
        loadLibrary();
        libPanel.querySelector("h2").focus({ preventScroll: true });
      } else if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        var ft = target.querySelector("input, textarea, button, h2");
        if (ft && typeof ft.focus === "function") ft.focus({ preventScroll: true });
      }
    };

    // Ensure Prompt Library is not shown unless the Prompt Library menu is active.
    var activeLink = document.querySelector(".nav-link.is-active");
    var initialSection = activeLink && activeLink.dataset ? activeLink.dataset.section : "overview";
    showSection(initialSection || "overview");

    // ── AI Prompt Engineering News Intel ───────────────────────────────────

    (function initAiPromptEngineeringNews() {
      var panel = document.getElementById("ai-prompt-engineering-panel");
      if (!panel) return;

      allPanels.push(panel);

      var refreshBtn = document.getElementById("ai-news-refresh-btn");
      var reloadBtn = document.getElementById("ai-news-reload-btn");
      var statusNode = document.getElementById("ai-news-status");
      var progressWrapNode = document.getElementById("ai-news-progress");
      var progressLabelNode = document.getElementById("ai-news-progress-label");
      var progressPercentNode = document.getElementById("ai-news-progress-percent");
      var cancelNewsJobBtn = document.getElementById("ai-news-cancel-btn");
      var progressTrackNode = document.getElementById("ai-news-progress-track");
      var progressFillNode = document.getElementById("ai-news-progress-fill");
      var cardsNode = document.getElementById("ai-news-cards");
      var cloudNode = document.getElementById("ai-news-keyword-cloud");
      var customPromptNode = document.getElementById("ai-news-custom-prompt");
      var applyPromptBtn = document.getElementById("ai-news-apply-btn");
      var defaultPromptBtn = document.getElementById("ai-news-default-prompt-btn");
      var companyFilterNode = document.getElementById("ai-news-company-filter");
      var categoryFilterNode = document.getElementById("ai-news-category-filter");
      var daysFilterNode = document.getElementById("ai-news-days-filter");
      var searchNode = document.getElementById("ai-news-search");
      var clearFiltersBtn = document.getElementById("ai-news-clear-filters");

      var allCards = [];
      var selectedKeyword = "";
      var customPromptStorageKey = "promptCoach.aiNewsCustomPrompt";
      var lookbackDaysStorageKey = "promptCoach.aiNewsLookbackDays";
      var seenUrlsStorageKey = "promptCoach.aiNewsSeenUrls";
      var lookbackDaysStart = 3;
      var lookbackDaysMax = 365;
      var newsActionQueue = Promise.resolve();
      var queuedNewsActions = 0;
      var activeNewsAction = false;
      var activeBackgroundJobId = "";

      function toYmd(date) {
        var d = date instanceof Date ? date : new Date(date);
        return d.toISOString().slice(0, 10);
      }

      function buildWeeklyCyberPrompt(startDate, endDate, cards) {
        var validatedCards = (Array.isArray(cards) ? cards : []).filter(function (c) { return c && c.validated; }).slice(0, 150);
        var contextRows = validatedCards.map(function (card, idx) {
          var keywords = Array.isArray(card.keywords) ? card.keywords.join(", ") : "";
          return [
            (idx + 1) + ". " + String(card.title || "Untitled"),
            "Fuente/URL: " + String(card.url || ""),
            "Fecha: " + String(card.published_at || card.last_checked_at || "N/A"),
            "Empresa: " + String(card.company || "N/A"),
            "Categoría: " + String(card.category || "news"),
            "Resumen base: " + String(card.summary || ""),
            "Keywords base: " + keywords,
          ].join("\n");
        }).join("\n\n");

        return `Actúa como un analista senior de inteligencia tecnológica especializado en Ciberseguridad, Inteligencia Artificial y Arquitectura Cloud, con foco PRIORITARIO en Microsoft y Google Cloud como partners estratégicos de CyberProof / UST.

CyberProof Spain opera en las siguientes áreas de conocimiento y entrega de servicios. Para CADA ítem indica el impacto usando estas etiquetas:
🏗️ [ARCH]    → Solutions Architecture
🔭 [SOC]     → Security Operations Center
📋 [GRC]     → Governance, Risk & Compliance
🔴 [PENTEST] → Penetration Testing & Red Team
⚙️ [DEVSEC]  → DevSecOps

Busca y sintetiza la información MÁS RELEVANTE de los últimos 7 días (semana del [FECHA_INICIO] al [FECHA_FIN]).

[FECHA_INICIO] = ${startDate}
[FECHA_FIN] = ${endDate}

────────────────────────────────────────────────────────
⚠️ REGLA GLOBAL OBLIGATORIA — FUENTES Y ENLACES
────────────────────────────────────────────────────────
Para CADA ítem en TODAS las secciones debes incluir obligatoriamente:
- Fuente oficial o medio especializado
- Enlace directo y verificable (blog, release note, repo, curso, certificación)
- Si no existe URL directa, incluir la URL de búsqueda más específica posible
- NUNCA dejar un ítem sin enlace

Cada fila debe incluir SIEMPRE:
- Producto / Título
- Fuente + URL
- Fecha
- Resumen (2–3 líneas, máximo)
- Área(s) CyberProof impactadas (usar etiquetas)
- Impacto estratégico u operativo (claro y accionable)

⚠️ TODAS las tablas deben contener EXACTAMENTE 5 ítems. No añadir más ni menos bajo ningún concepto.

────────────────────────────────────────────────────────
## [1] 🔐 CIBERSEGURIDAD + IA
────────────────────────────────────────────────────────
Busca noticias relevantes sobre:
- Vulnerabilidades críticas (CVEs con CVSS ≥ 8.0), 0‑days y explotación activa
- Uso ofensivo y defensivo de IA en ciberseguridad
- Automatización SOC, detección avanzada, SOAR y response con IA
- Incidentes de seguridad relevantes a nivel global
- Movimientos de vendors clave:
  Microsoft, Google, CrowdStrike, Palo Alto, Fortinet, SentinelOne
- Regulación y compliance:
  EU AI Act, NIS2, DORA, ENS, ISO 27001, NIST
- Nuevas TTPs, APTs y técnicas de red team con IA
- Nuevas herramientas de seguridad basadas en IA

Fuentes preferidas: Dark Reading, Krebs on Security, The Hacker News, BleepingComputer, CISA KEV, MITRE ATT&CK, blogs oficiales de fabricantes.

Columnas:
| # | Título | Fuente + Enlace | Fecha | Resumen | Área CyberProof | Impacto Estratégico |

────────────────────────────────────────────────────────
## [2] 🧑‍💻 PERSONAS RELEVANTES EN IA
────────────────────────────────────────────────────────
Busca entrevistas, podcasts, artículos o charlas recientes de líderes relevantes en IA y Ciberseguridad, incluyendo (pero no limitado a):
Dario Amodei, Demis Hassabis, Sam Altman, Yann LeCun, Geoffrey Hinton, Fei‑Fei Li, Andrej Karpathy, Jensen Huang, Mustafa Suleyman, Sundar Pichai, Satya Nadella, Charlie Bell.

Para cada aparición incluye:
- Persona
- Formato (podcast, entrevista, keynote, artículo)
- Medio + enlace directo al contenido concreto
- Fecha
- 2–3 ideas clave expresadas (no citas largas)
- Área(s) CyberProof impactadas

Columnas:
| Persona | Formato | Medio + Enlace | Fecha | Ideas Clave | Área CyberProof |

────────────────────────────────────────────────────────
## [3] 🚀 NUEVO SOFTWARE / HARDWARE DE IA
────────────────────────────────────────────────────────
Busca lanzamientos o novedades sobre:
- Nuevos LLMs y modelos multimodales
- Frameworks de agentes y orquestación
- Plataformas de IA cloud
- Herramientas de seguridad con IA integrada
- Hardware de IA (GPU, NPU, chips especializados)

Para cada ítem incluye:
- Nombre del producto
- Fabricante / Vendor
- Fecha de anuncio o disponibilidad
- Características clave (enfocadas a enterprise)
- Caso de uso principal
- Enlace oficial
- Área(s) CyberProof impactadas

Columnas:
| # | Nombre | Fabricante | Fecha | Características Clave | Caso de Uso | Enlace | Área CyberProof |

────────────────────────────────────────────────────────
## [4] 🔷 MICROSOFT & 🔴 GOOGLE — Novedades de Seguridad e IA
## (CYBERPROOF PARTNERS — PRIORITARIO)
────────────────────────────────────────────────────────
Este apartado es PRIORITARIO y debe analizarse con máximo detalle.

### 🔷 MICROSOFT
Busca novedades en: Microsoft Sentinel, Defender XDR, Copilot for Security, Purview, Entra ID, Defender for Cloud, Azure DevOps / GitHub Advanced Security, Azure AI Foundry / Azure OpenAI, Patch Tuesday, herramientas de Red / Purple Team (Defender, DART, MSTIC).

Fuentes oficiales:
- https://www.microsoft.com/en-us/security/blog/
- https://techcommunity.microsoft.com/category/microsoft-security

### 🔴 GOOGLE
Busca novedades en: Google SecOps / Chronicle, Security Command Center, Mandiant Threat Intelligence / M-Trends, Workspace Security, VirusTotal, Gemini for Security, Google Cloud Security, Vertex AI, Project Zero.

Fuentes oficiales:
- https://cloud.google.com/blog/topics/threat-intelligence
- https://www.mandiant.com/resources/blog

Para CADA ítem (Microsoft y Google) incluye:
- Producto afectado
- Descripción clara de la novedad
- Disponibilidad (GA / Preview / Beta) y fecha
- Área(s) CyberProof impactadas
- Impacto directo para CyberProof como MSSP / Partner
- Oportunidad de negocio o acción recomendada

Columnas:
| # | Producto | Novedad | Disponibilidad | Área CyberProof | Impacto MSSP | Acción Recomendada |

────────────────────────────────────────────────────────
## [5] 🏗️ ARQUITECTURA DE IA — MICROSOFT & GOOGLE CLOUD
────────────────────────────────────────────────────────
Analiza patrones y capacidades de arquitectura IA:
- Arquitecturas RAG enterprise
- Agentes y sistemas multi‑agente
- Seguridad de IA, aislamiento y Zero Trust for AI
- Observabilidad, evaluación y red‑teaming de modelos
- Responsible AI y governance
- Integración IA con SOC, SIEM, SOAR y GRC

Columnas:
| # | Plataforma | Capability / Patrón | Enlace | Área CyberProof | Impacto Arquitectura | Oportunidad |

────────────────────────────────────────────────────────
## [6] 🎓 CURSOS Y CERTIFICACIONES — IA & CIBERSEGURIDAD
────────────────────────────────────────────────────────
Busca cursos, learning paths y certificaciones nuevas o relevantes, tanto para enablement interno como para clientes.

Plataformas prioritarias: Microsoft Learn, Google Cloud Skills Boost, SANS, ISC², ISACA, Offensive Security, Coursera / edX (enterprise‑relevantes).

Columnas:
| # | Curso / Certificación | Plataforma | Nivel | Público Objetivo | Enlace | Valor para CyberProof |

────────────────────────────────────────────────────────
## [7] 💻 PROYECTOS RELEVANTES DE GITHUB
────────────────────────────────────────────────────────
Busca repositorios trending con impacto en: SOC, GRC, Pentest, DevSecOps y Arquitectura IA.

Columnas:
| # | Repo | Org | ⭐ | Δ Semana | Enlace | Área CyberProof | Relevancia |

────────────────────────────────────────────────────────
## SECCIÓN FINAL OBLIGATORIA
────────────────────────────────────────────────────────
### 🔥 TOP 3 HIGHLIGHTS DE LA SEMANA
| # | Highlight | Por qué importa (2–3 líneas) | Área líder | Enlace |

### 💼 OPORTUNIDADES DE NEGOCIO CYBERPROOF SPAIN
| # | Oportunidad | Área | Acción Recomendada | Horizonte |

### 📊 RADAR DE ÁREAS
| Área | # Ítems esta semana | Nivel de impacto |

FORMATO FINAL:
- Idioma: Español
- Tablas en todas las secciones
- EXACTAMENTE 5 ítems por tabla
- Resúmenes SIEMPRE de 2–3 líneas
- Enlace visible en cada fila
- Estilo profesional, claro y accionable

Usa y cita de forma prioritaria el siguiente CONTEXTO VALIDADO (si no alcanza, amplía con fuentes públicas actuales manteniendo enlaces verificables):

${contextRows || "No hay contexto validado suficiente en base de datos; amplía con fuentes públicas verificables."}`;
      }

      function getDefaultAiNewsPromptTemplate() {
        return `SYSTEM / ROLE
You are an CyberSecurity AI Technology Intelligence Analyst and Research Agent. Your job is to find and synthesize the newest CyberSecurity AI technology updates with verified sources.

IMPORTANT EXECUTION RULES
- Use Internet search tools and web browsing tools whenever available.
- Use a ReAct-style loop internally (Reason -> Act -> Observe -> Reason...), but DO NOT reveal your private chain-of-thought.
- Provide a clean final report with citations/links and a transparent validation checklist.
- Never invent news, dates, quotes, or URLs.
- Do not paste full copyrighted articles. Summarize in your own words and include short excerpts only when allowed by fair use (very small snippets).

USER CONFIG (VARIABLES)
- TodayDate: {{TODAY_DATE}}   (If not provided, infer from system date)
- LookbackDays: {{LOOKBACK_DAYS}}  (default: 7)
- TimelineMode: {{TIMELINE_MODE}}  (options: "incremental-by-day", "single-window")
- MaxItemsPerDay: {{MAX_ITEMS_PER_DAY}} (default: 6)
- Regions: {{REGIONS}} (default: "global", optional: "EU", "US", "APAC")
- OutputDepth: {{OUTPUT_DEPTH}} (default: "executive", options: "executive", "deep")
- PreviouslySeenURLs: {{SEEN_URLS}} (optional; list of URLs already used to avoid duplicates)

SCOPE (MUST COVER)
Vendors / orgs (include official + notable ecosystem):
- Anthropic, Google (Gemini/DeepMind), Meta (Llama/FAIR), NVIDIA, DeepSeek,
  OpenAI, Microsoft Copilot
Add more vendors this run (include if they have relevant updates):
- xAI, Mistral, Cohere, Hugging Face, Perplexity, Stability AI,
  Amazon (AWS/Bedrock), IBM (watsonx), Salesforce, Databricks, Snowflake,
  Oracle, SAP, ServiceNow, Tencent, Baidu, Alibaba, Apple (AI), AMD, Intel
Also include:
- Agentic systems (multi-agent, orchestration, tool use, evaluation, memory, safety)
- Prompting patterns & best practices
- Tutorials, workflows, guidelines, learning content (docs, blogs, GitHub, arXiv)

SOURCE PRIORITY (IN ORDER)
1) Primary: CyberSecurity official blogs, CyberSecurity release notes, CyberSecurity documentation, CyberSecurity GitHub repos, CyberSecurity arXiv papers
2) Reputable secondary: CyberSecurity TechCrunch, CyberSecurity The Verge, CyberSecurity VentureBeat, CyberSecurity IEEE Spectrum, etc.
3) CyberSecurity Community posts only if corroborated by primary source.

TIMELINE REQUIREMENT
If TimelineMode = "incremental-by-day":
- Break the lookback window into day slices:
  Day 0 (today), Day 1 (yesterday), ... Day N-1
- For each day slice, find NEW items published on that date.
If TimelineMode = "single-window":
- Search within the last LookbackDays as one window.
In both modes, ensure content is within the date range and state the publication date.

NOVELTY / DEDUPLICATION
- Do not repeat items already in PreviouslySeenURLs.
- Prefer new vendor announcements, new model/tool releases, new benchmarks, new tutorials.
- If you find repeated coverage, choose the most primary source and drop duplicates.

TOOL / BROWSING PROTOCOL (REACT)
You must use tools like Search and Open/Browser.
For each day slice (or for the window):
1) SEARCH: run targeted queries per vendor + topic using date operators when possible.
   Example queries:
   - "<vendor> blog release notes" + date
   - "<vendor> model release" + after:<date>
   - "agentic workflow orchestration framework" + after:<date>
   - "prompt patterns tutorial" + after:<date>
2) OPEN: open each candidate link and confirm:
   - publication date
   - vendor/topic relevance
   - legitimacy (official/reputable source)
3) EXTRACT: capture:
   - title, date, vendor, category
   - 2-3 factual takeaways
   - why it matters (business + technical)
   - 1-2 supporting details (metrics, features, compatibility, limitations)
4) VALIDATE:
   - link reachable
   - date inside range
   - not in PreviouslySeenURLs
   - no contradictions between sources

OUTPUT (STRICT FORMAT)
Return BOTH:
A) A Markdown briefing for humans
B) A JSON block for automation

A) MARKDOWN REPORT
---
## AI Technology Briefing — {{TODAY_DATE}} (Lookback: {{LOOKBACK_DAYS}} days)

### Date Range Covered
- Start: <computed>
- End: <computed>

### 1) Top Headlines (Most Important)
For each item:
**Title**
- Organization:
- Category: (Model / Research / Product / Agentic / Prompting / Tutorial / Workflow / Policy / Other)
- Published date:
- Key takeaway: (2-3 factual sentences)
- Why it matters: (1-2 sentences)
- Source link(s):
  - [Descriptive link text](FULL_URL)

### 2) Agentic Systems & Orchestration (Highlights)
(same structure)

### 3) Prompting Patterns & Best Practices (Highlights)
(same structure)

### 4) Tutorials, Workflows, Guidelines, Learning Content (Highlights)
(same structure)

### 5) Vendor Roundup (Quick bullets by vendor)
- Anthropic:
- Google Gemini:
- Meta:
- NVIDIA:
- DeepSeek:
- OpenAI:
- Microsoft Copilot:
- + New vendors found this run:

### 6) "Retrieved Article" (One deep dive)
Pick ONE most impactful article found this run and provide:
- Citation (title/date/vendor + link)
- 5-8 bullet summary (factual)
- Practical takeaways (3 bullets)
- If relevant: "How to apply" (presales/architecture angle)
- Minimal excerpt (<= 2 short quotes or <= ~60 words total), only if present on page

### 7) Validation Checklist
- All links opened and reachable at time of writing
- Publication dates verified inside range
- No duplicates with PreviouslySeenURLs
- Primary sources prioritized
- No speculation; claims tied to sources

B) JSON OUTPUT (MACHINE-READABLE)
Return a JSON object:
{
  "generated_on": "...",
  "date_range": {"start":"...", "end":"..."},
  "lookback_days": ...,
  "items": [
    {
      "title": "...",
      "organization": "...",
      "category": "...",
      "published_date": "...",
      "summary": "...",
      "why_it_matters": "...",
      "urls": ["..."],
      "day_bucket": "Day0|Day1|...|Window",
      "confidence": 0.0-1.0
    }
  ],
  "featured_article": {
    "title": "...",
    "published_date": "...",
    "url": "...",
    "summary_bullets": ["..."],
    "practical_takeaways": ["..."]
  }
}

FAIL-SAFES
- If browsing/search tools are unavailable, say so clearly and provide only a suggested query plan (no fabricated results).
- If a vendor has no credible updates in range, state: "No significant updates found."

BEGIN NOW using the tools available.

CONTINUOUS MODE
At the end of the report, output:
- "NewURLsToStore": list of all URLs used this run
Next run, the user will paste those into PreviouslySeenURLs to prevent repetition.
Prefer sources not seen before and new publication dates.

Validated source context from the database:
[CONTEXTO_VALIDADO]`;
      }

      function isLegacyAiNewsPromptTemplate(value) {
        var normalized = String(value || "");
        return (
          (normalized.indexOf("CyberProof Spain opera en las siguientes áreas de conocimiento") !== -1
            && normalized.indexOf("TOP 3 HIGHLIGHTS DE LA SEMANA") !== -1)
          || normalized.indexOf("GOAL\nProduce a concise, accurate weekly briefing of the most important AI technology news") !== -1
          || normalized.indexOf("Always retrieve news one") !== -1
          || normalized.indexOf("PRIMARY OBJECTIVE\n- Maximize the number of unique, newly published AI technology articles.") !== -1
        );
      }

      function clampLookbackDays(value) {
        var n = Number(value || 0);
        if (!Number.isFinite(n)) return lookbackDaysStart;
        n = Math.floor(n);
        if (n < 1) return lookbackDaysStart;
        if (n > lookbackDaysMax) return lookbackDaysMax;
        return n;
      }

      function getCurrentLookbackDays() {
        try {
          return clampLookbackDays(window.localStorage.getItem(lookbackDaysStorageKey));
        } catch (_error) {
          return lookbackDaysStart;
        }
      }

      function setCurrentLookbackDays(value) {
        try {
          window.localStorage.setItem(lookbackDaysStorageKey, String(clampLookbackDays(value)));
        } catch (_error) {
          // Ignore storage failures.
        }
      }

      function incrementLookbackDays() {
        var nextValue = Math.min(lookbackDaysMax, getCurrentLookbackDays() + 1);
        setCurrentLookbackDays(nextValue);
        return nextValue;
      }

      function getSeenUrls() {
        try {
          var raw = String(window.localStorage.getItem(seenUrlsStorageKey) || "[]");
          var parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return [];
          return parsed.map(function (u) { return String(u || "").trim(); }).filter(Boolean);
        } catch (_error) {
          return [];
        }
      }

      function persistSeenUrls(urls) {
        var list = Array.isArray(urls) ? urls : [];
        var cleaned = [];
        var seen = {};
        for (var i = 0; i < list.length; i += 1) {
          var url = String(list[i] || "").trim();
          if (!url || seen[url]) continue;
          seen[url] = true;
          cleaned.push(url);
          if (cleaned.length >= 3000) break;
        }
        try {
          window.localStorage.setItem(seenUrlsStorageKey, JSON.stringify(cleaned));
        } catch (_error) {
          // Ignore storage failures.
        }
      }

      function buildContextRows(cards, maxItems) {
        var validatedCards = (Array.isArray(cards) ? cards : []).filter(function (c) { return c && c.validated; }).slice(0, Math.max(1, Number(maxItems || 80)));
        return validatedCards.map(function (card, idx) {
          var keywords = Array.isArray(card.keywords) ? card.keywords.join(", ") : "";
          return [
            (idx + 1) + ". " + String(card.title || "Untitled"),
            "Fecha: " + String(card.published_at || card.last_checked_at || "N/A"),
            "Empresa: " + String(card.company || "N/A"),
            "Categoría: " + String(card.category || "news"),
            "Resumen del contenido: " + String(card.summary || ""),
            "Keywords: " + keywords,
          ].join("\n");
        }).join("\n\n");
      }

      function replacePromptVariable(text, name, value) {
        return String(text || "")
          .split("{{" + name + "}}").join(String(value || ""))
          .split("[" + name + "]").join(String(value || ""));
      }

      function materializeAiNewsPromptTemplate(template, vars) {
        var built = String(template || "");
        built = replacePromptVariable(built, "TODAY_DATE", vars.todayDate);
        built = replacePromptVariable(built, "LOOKBACK_DAYS", vars.lookbackDays);
        built = replacePromptVariable(built, "TIMELINE_MODE", vars.timelineMode);
        built = replacePromptVariable(built, "MAX_ITEMS_PER_DAY", vars.maxItemsPerDay);
        built = replacePromptVariable(built, "REGIONS", vars.regions);
        built = replacePromptVariable(built, "OUTPUT_DEPTH", vars.outputDepth);
        built = replacePromptVariable(built, "SEEN_URLS", vars.seenUrls);
        built = replacePromptVariable(built, "CONTEXTO_VALIDADO", vars.contextRows);
        built = replacePromptVariable(built, "FECHA_INICIO", vars.weekStart);
        built = replacePromptVariable(built, "FECHA_FIN", vars.weekEnd);
        return built;
      }

      function getMandatoryAiBriefingRequirements() {
        return [
          "MANDATORY EXECUTION ENFORCEMENT",
          "- Use internet search and browsing tools whenever available.",
          "- Use ReAct internally, but do not reveal private chain-of-thought.",
          "- Verify every URL is reachable and every date is within requested range.",
          "- Never fabricate links, dates, or claims.",
          "- Return BOTH markdown briefing and JSON output.",
          "- End report with NewURLsToStore list.",
          "",
          "PER-CALL MODE",
          "- incremental-by-day mode",
          "- MaxItemsPerDay=5",
          "- OutputDepth=executive",
        ].join("\n");
      }

      function estimatePromptTokens(text) {
        var chars = String(text || "").length;
        return Math.max(1, Math.ceil(chars / 4));
      }

      function collectValidatedUrls(cards, cap) {
        var max = Math.max(1, Number(cap || 200));
        var out = [];
        var seen = {};
        (Array.isArray(cards) ? cards : []).forEach(function (card) {
          if (!card || !card.validated) return;
          var url = String(card.url || "").trim();
          if (!url || seen[url]) return;
          seen[url] = true;
          out.push(url);
        });
        return out.slice(0, max);
      }

      function persistAiNewsPromptTemplate(value) {
        try {
          window.localStorage.setItem(customPromptStorageKey, String(value || ""));
        } catch (_error) {
          // Ignore storage failures and keep using the in-memory value.
        }
      }

      function initializeAiNewsPromptTemplate() {
        if (!customPromptNode) return;
        var storedPrompt = "";
        try {
          storedPrompt = String(window.localStorage.getItem(customPromptStorageKey) || "");
        } catch (_error) {
          storedPrompt = "";
        }
        if (!storedPrompt || isLegacyAiNewsPromptTemplate(storedPrompt)) {
          storedPrompt = getDefaultAiNewsPromptTemplate();
        }
        customPromptNode.value = storedPrompt;
        persistAiNewsPromptTemplate(customPromptNode.value);
      }

      async function runWeeklyLlmAnalysis(cards, newUrlsFromThisRun) {
        var cfg = getLlmConfig();
        var lookbackDays = getCurrentLookbackDays();
        var start = new Date();
        start.setDate(start.getDate() - lookbackDays);
        var end = new Date();
        var weekStart = toYmd(start);
        var weekEnd = toYmd(end);
        var todayDate = weekEnd;

        var contextRows = buildContextRows(cards, 200);
        var seenUrls = getSeenUrls();
        var seenUrlsForPrompt = seenUrls.length
          ? seenUrls.join("\n")
          : "(none)";

        var runtimeDirective = [
          "Run the AI Technology Briefing prompt in incremental-by-day mode.",
          "LookbackDays=" + lookbackDays + ", MaxItemsPerDay=5, OutputDepth=executive.",
          "PreviouslySeenURLs = " + seenUrlsForPrompt + ".",
          "Ensure all links opened and dates verified.",
        ].join("\n");

        var promptTemplate = customPromptNode ? String(customPromptNode.value || "").trim() : "";
        var baseTemplate = promptTemplate && promptTemplate.length >= 600
          ? promptTemplate
          : getDefaultAiNewsPromptTemplate();
        var mandatoryRequirements = getMandatoryAiBriefingRequirements();
        var prompt = materializeAiNewsPromptTemplate(baseTemplate, {
          todayDate: todayDate,
          lookbackDays: lookbackDays,
          timelineMode: "incremental-by-day",
          maxItemsPerDay: 5,
          regions: "global",
          outputDepth: "executive",
          seenUrls: seenUrlsForPrompt,
          contextRows: contextRows || "No hay contexto validado suficiente en base de datos; amplía con fuentes públicas verificables.",
          weekStart: weekStart,
          weekEnd: weekEnd,
        }) + "\n\n" + mandatoryRequirements + "\n\n" + runtimeDirective;

        var promptChars = String(prompt || "").length;
        var promptTokenEstimate = estimatePromptTokens(prompt);

        var response = await fetch("/api/news/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseUrl: String(cfg.baseUrl || "http://localhost:1234/v1"),
            model: String(cfg.model || "qwen2.5-7b-instruct"),
            apiKey: String(cfg.apiKey || ""),
            // ✅ DEFAULT TIMEOUT INCREASED: 180s (3 min) → 360s (6 min) for 200-article context
            timeout: Math.max(360000, Number(cfg.timeout || 360000) || 360000),
            prompt: prompt,
            systemPrompt:
              `SYSTEM / ROLE You are an AI Technology Intelligence Analyst and Research Agent. Your job is to find and synthesize the newest AI technology updates with verified sources. IMPORTANT EXECUTION RULES - Use Internet search tools and web browsing tools whenever available.Never invent news, dates, quotes, or URLs.Vendors / orgs (include official + notable ecosystem): - Anthropic, Google (Gemini/DeepMind), Meta (Llama/FAIR), NVIDIA, DeepSeek, OpenAI, Microsoft Copilot Add more vendors this run (include if they have relevant updates): - xAI, Mistral, Cohere, Hugging Face, Perplexity, Stability AI, Amazon (AWS/Bedrock), IBM (watsonx), Salesforce, Databricks, Snowflake, Oracle, SAP, ServiceNow, Tencent, Baidu, Alibaba, Apple (AI), AMD, Intel Also include: - Agentic systems (multi-agent, orchestration, tool use, evaluation, memory, safety) - Prompting patterns & best practices - Tutorials, workflows, guidelines, learning content (docs, blogs, GitHub, arXiv) SOURCE PRIORITY (IN ORDER) 1) Primary: official blogs, release notes, documentation, GitHub repos, arXiv papers 2) Reputable secondary: TechCrunch, The Verge, VentureBeat, IEEE Spectrum, etc.Do not repeat items already in PreviouslySeenURLs. - Prefer new vendor announcements, new model/tool releases, new benchmarks, new tutorials. - If you find repeated coverage, choose the most primary source and drop duplicates.A Markdown briefing for humans 1) Top Headlines (Most Important) For each item: Title - Organization: - Category: (Model / Research / Product / Agentic / Prompting / Tutorial / Workflow / Policy / Other) - Published date: - Key takeaway: (2-3 factual sentences) - Why it matters: (1-2 sentences) - Source link(s): - Descriptive link text ### 2) Agentic Systems & Orchestration (Highlights) (same structure) ### 3) Prompting Patterns & Best Practices (Highlights) (same structure) ### 4) Tutorials, Workflows, Guidelines, Learning Content (Highlights) (same structure) 6) "Retrieved Article" (One deep dive) Pick ONE most impactful article found this run and provide: - Citation (title/date/vendor + link) - 5-8 bullet summary (factual) - Practical takeaways (3 bullets) - If relevant: "How to apply" (presales/architecture angle) - Minimal excerpt (<= 2 short quotes or <= ~60 words total), only if present on page ### 7) Validation Checklist - All links opened and reachable at time of writing -No duplicates with PreviouslySeenURLs - Primary sources prioritized - No speculation; claims tied to sources`,
            temperature: 0.15,
            maxTokens: 12000,
            reactMode: true,
            reasoningEffort: "high",
            useInternalReasoning: true,
            articleTitle: "Weekly Intelligence Report " + weekStart + " to " + weekEnd,
            weekStart: weekStart,
            weekEnd: weekEnd,
          }),
        });

        if (!response.ok) {
          var text = await response.text();
          var statusCode = response.status;
          
          // ✅ NEW: Handle timeout explicitly (504 status)
          if (statusCode === 504) {
            try {
              var errorPayload = JSON.parse(text);
              var suggestedTimeout = errorPayload.suggestion_increase_timeout || Math.round(errorPayload.timeout_seconds || 300) + 60;
              throw new Error(
                "LLM Analysis Timeout: Request exceeded " + 
                errorPayload.timeout_seconds + "s limit. " +
                "Try increasing timeout in Settings to " + suggestedTimeout + "s or use a faster model."
              );
            } catch (e) {
              if (e.message && e.message.includes("LLM Analysis Timeout")) throw e;
              throw new Error("LLM analysis timed out. Try increasing timeout in Settings.");
            }
          }
          
          // ✅ NEW: Handle unreachable endpoint (503 status)
          if (statusCode === 503) {
            throw new Error("LLM endpoint is not responding. Verify LM Studio is running at " + cfg.baseUrl);
          }
          
          throw new Error("LLM analysis failed: " + text.slice(0, 220));
        }

        var payload = await response.json();
        var report = String(payload.analysis || "").trim();
        if (!report) {
          throw new Error("LLM returned empty analysis");
        }

        var urlsForThisRun = Array.isArray(newUrlsFromThisRun) && newUrlsFromThisRun.length
          ? newUrlsFromThisRun
          : collectValidatedUrls(cards, 300);
        persistSeenUrls(getSeenUrls().concat(urlsForThisRun));
        incrementLookbackDays();

        void openWindowPopup({
          title: "Weekly Intelligence Report",
          markdown: report,
          closeText: "Close",
          enableDownload: true,
          downloadRaw: report,
          downloadTitle: "weekly-intelligence-report",
        });

        return {
          promptChars: promptChars,
          promptTokenEstimate: promptTokenEstimate,
          upstreamPromptTokens: Number(payload?.usage?.prompt_tokens || 0),
          upstreamCompletionTokens: Number(payload?.usage?.completion_tokens || 0),
          upstreamTotalTokens: Number(payload?.usage?.total_tokens || 0),
        };
      }

      function setStatus(message, tone) {
        if (!statusNode) return;
        statusNode.textContent = message;
        statusNode.dataset.tone = tone || "neutral";
      }

      function setProgressUI(progress, message) {
        if (!progressWrapNode || !progressFillNode || !progressPercentNode || !progressTrackNode) return;
        var pct = Math.max(0, Math.min(100, Math.floor(Number(progress || 0))));
        progressWrapNode.hidden = false;
        progressFillNode.style.width = pct + "%";
        progressPercentNode.textContent = pct + "%";
        progressTrackNode.setAttribute("aria-valuenow", String(pct));
        if (progressLabelNode) {
          progressLabelNode.textContent = message ? String(message) : "Background retrieval in progress...";
        }
        if (cancelNewsJobBtn) {
          cancelNewsJobBtn.hidden = !activeBackgroundJobId;
          cancelNewsJobBtn.disabled = !activeBackgroundJobId;
        }
      }

      function hideProgressUI() {
        if (!progressWrapNode || !progressFillNode || !progressPercentNode || !progressTrackNode) return;
        activeBackgroundJobId = "";
        progressWrapNode.hidden = true;
        progressFillNode.style.width = "0%";
        progressPercentNode.textContent = "0%";
        progressTrackNode.setAttribute("aria-valuenow", "0");
        if (cancelNewsJobBtn) {
          cancelNewsJobBtn.hidden = true;
          cancelNewsJobBtn.disabled = false;
        }
      }

      function wait(ms) {
        return new Promise(function (resolve) {
          setTimeout(resolve, ms);
        });
      }

      async function runBackgroundRefresh(refreshOptions) {
        var startResponse = await fetch("/api/news/refresh/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(refreshOptions || {}),
        });

        if (!startResponse.ok) {
          var startErrText = await startResponse.text();
          throw new Error("Failed to start background refresh: " + (startErrText || ("HTTP " + startResponse.status)));
        }

        var startPayload = await startResponse.json();
        var jobId = String(startPayload.jobId || "").trim();
        if (!jobId) {
          throw new Error("Background refresh did not return a job id");
        }

        activeBackgroundJobId = jobId;
        if (cancelNewsJobBtn) {
          cancelNewsJobBtn.hidden = false;
          cancelNewsJobBtn.disabled = false;
        }

        setProgressUI(Number(startPayload.progress || 5), String(startPayload.message || "Queued"));

        var maxPolls = 360;
        for (var attempt = 0; attempt < maxPolls; attempt += 1) {
          await wait(1000);
          var statusResponse = await fetch("/api/news/refresh/status/" + encodeURIComponent(jobId));
          if (!statusResponse.ok) {
            var statusErrText = await statusResponse.text();
            throw new Error("Background refresh status failed: " + (statusErrText || ("HTTP " + statusResponse.status)));
          }

          var statusPayload = await statusResponse.json();
          setProgressUI(Number(statusPayload.progress || 0), String(statusPayload.message || "Processing"));

          if (statusPayload.status === "completed") {
            setProgressUI(100, "Completed");
            return statusPayload;
          }
          if (statusPayload.status === "cancelled") {
            setProgressUI(100, String(statusPayload.message || "Cancelled"));
            return statusPayload;
          }
          if (statusPayload.status === "failed") {
            throw new Error(String(statusPayload.error || "Background refresh failed"));
          }
        }

        throw new Error("Background refresh timed out");
      }

      async function cancelBackgroundRefreshJob() {
        if (!activeBackgroundJobId) return;
        var jobId = activeBackgroundJobId;
        if (cancelNewsJobBtn) {
          cancelNewsJobBtn.disabled = true;
        }
        try {
          var response = await fetch("/api/news/refresh/cancel/" + encodeURIComponent(jobId), {
            method: "POST",
          });
          if (!response.ok) {
            var errText = await response.text();
            throw new Error("Cancel failed: " + (errText || ("HTTP " + response.status)));
          }
          var payload = await response.json();
          setProgressUI(Number(payload.progress || 100), String(payload.message || "Cancellation requested"));
          setStatus("Background retrieval cancellation requested.", "neutral");
        } catch (error) {
          setStatus("Unable to cancel background retrieval: " + (error instanceof Error ? error.message : "Unknown error"), "error");
          if (cancelNewsJobBtn) {
            cancelNewsJobBtn.disabled = false;
          }
        }
      }

      function setNewsActionBusy(isBusy) {
        activeNewsAction = !!isBusy;
        if (reloadBtn) reloadBtn.disabled = !!isBusy;
      }

      function enqueueNewsAction(sourceLabel, action) {
        queuedNewsActions += 1;
        if (queuedNewsActions > 1) {
          setStatus("Queued AI news request #" + queuedNewsActions + " from " + sourceLabel + ".", "neutral");
        }

        var runTask = async function () {
          var position = queuedNewsActions;
          queuedNewsActions -= 1;
          setNewsActionBusy(true);
          if (position > 1) {
            setStatus("Processing queued AI news request from " + sourceLabel + ". Remaining queue: " + (position - 1) + ".", "neutral");
          }
          try {
            return await action();
          } finally {
            setNewsActionBusy(false);
            if (queuedNewsActions > 0) {
              setStatus("AI news queue still has " + queuedNewsActions + " pending request(s).", "neutral");
            }
          }
        };

        newsActionQueue = newsActionQueue.then(runTask, runTask);
        return newsActionQueue;
      }

      function formatDate(value) {
        if (!value) return "Unknown date";
        var date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString();
      }

      function buildKeywordCloudFromCards(cards) {
        var counts = {};
        (Array.isArray(cards) ? cards : []).forEach(function (card) {
          var keywords = Array.isArray(card.keywords) ? card.keywords : [];
          keywords.forEach(function (kw) {
            var key = String(kw || "").trim().toLowerCase();
            if (!key) return;
            counts[key] = (counts[key] || 0) + 1;
          });
        });
        return counts;
      }

      function readFilters() {
        return {
          company: companyFilterNode ? String(companyFilterNode.value || "") : "",
          category: categoryFilterNode ? String(categoryFilterNode.value || "") : "",
          days: daysFilterNode ? Number(daysFilterNode.value || 0) : 0,
          search: searchNode ? String(searchNode.value || "").trim().toLowerCase() : "",
          keyword: selectedKeyword,
        };
      }

      function populateFilterOptions(cards) {
        var list = Array.isArray(cards) ? cards : [];
        var currentCompany = companyFilterNode ? String(companyFilterNode.value || "") : "";
        var currentCategory = categoryFilterNode ? String(categoryFilterNode.value || "") : "";

        var companies = Array.from(new Set(list.map(function (c) { return String(c.company || "").trim(); }).filter(Boolean))).sort();
        var categories = Array.from(new Set(list.map(function (c) { return String(c.category || "").trim(); }).filter(Boolean)));
        ["learning", "tutorial", "training"].forEach(function (cat) {
          if (categories.indexOf(cat) === -1) categories.push(cat);
        });
        categories.sort();

        if (companyFilterNode) {
          companyFilterNode.innerHTML = "<option value=''>All companies</option>" + companies.map(function (c) {
            return "<option value='" + escHtml(c) + "'>" + escHtml(c) + "</option>";
          }).join("");
          if (companies.includes(currentCompany)) {
            companyFilterNode.value = currentCompany;
          }
        }

        if (categoryFilterNode) {
          categoryFilterNode.innerHTML = "<option value=''>All categories</option>" + categories.map(function (c) {
            return "<option value='" + escHtml(c) + "'>" + escHtml(c) + "</option>";
          }).join("");
          if (categories.includes(currentCategory)) {
            categoryFilterNode.value = currentCategory;
          }
        }
      }

      function applyFilters(cards) {
        var list = Array.isArray(cards) ? cards : [];
        var filter = readFilters();
        var cutoff = filter.days > 0 ? new Date(Date.now() - filter.days * 864e5) : null;
        return list.filter(function (card) {
          if (!card || !card.validated) return false;
          if (filter.company && String(card.company || "") !== filter.company) return false;
          if (filter.category && String(card.category || "") !== filter.category) return false;

          if (cutoff) {
            var dateVal = card.published_at || card.last_checked_at;
            if (!dateVal) return false;
            var cardDate = new Date(dateVal);
            if (isNaN(cardDate.getTime()) || cardDate < cutoff) return false;
          }

          var keywords = Array.isArray(card.keywords) ? card.keywords.map(function (k) { return String(k).toLowerCase(); }) : [];
          if (filter.keyword && keywords.indexOf(filter.keyword) === -1) return false;

          if (filter.search) {
            var haystack = [
              String(card.title || ""),
              String(card.summary || ""),
              String(card.company || ""),
              String(card.category || ""),
              keywords.join(" "),
            ].join(" ").toLowerCase();
            if (haystack.indexOf(filter.search) === -1) return false;
          }

          return true;
        });
      }

      function renderKeywordCloud(cloud) {
        if (!cloudNode) return;
        var entries = Object.entries(cloud || {}).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 45);
        if (!entries.length) {
          cloudNode.innerHTML = "<span class='tag-chip'>No keywords yet</span>";
          return;
        }

        var max = entries[0][1] || 1;
        cloudNode.innerHTML = entries.map(function (entry) {
          var word = entry[0];
          var count = Number(entry[1] || 0);
          var size = 0.78 + (Math.min(count, max) / max) * 0.56;
          var activeClass = selectedKeyword === word ? " is-active" : "";
          return "<button class='tag-chip ai-keyword-chip" + activeClass + "' type='button' data-keyword='" + escHtml(word) + "' style='font-size:" + size.toFixed(2) + "rem' title='" + escHtml(word) + " (" + count + ")'>" + escHtml(word) + "</button>";
        }).join("");

        cloudNode.querySelectorAll("[data-keyword]").forEach(function (chip) {
          chip.addEventListener("click", function () {
            var value = String(chip.getAttribute("data-keyword") || "");
            selectedKeyword = selectedKeyword === value ? "" : value;
            renderCurrentView();
          });
        });
      }

      function renderCards(cards) {
        if (!cardsNode) return;
        var validOnly = Array.isArray(cards) ? cards : [];

        if (!validOnly.length) {
          cardsNode.innerHTML = "<p class='lib-empty'>No validated cards yet. Click the refresh button to discover and validate URLs from leading LLM providers.</p>";
          return;
        }

        cardsNode.innerHTML = validOnly.map(function (card) {
          var keywords = Array.isArray(card.keywords) ? card.keywords : [];
          var chips = keywords.slice(0, 8).map(function (k) {
            return "<span class='tag-chip'>" + escHtml(String(k)) + "</span>";
          }).join("");
          var webpageSummary = String(card.summary || "No webpage summary available.").trim();
          var cardUrl = String(card.url || "").trim();

          return "<article class='ai-news-card'>" +
            "<div class='ai-news-card-head'>" +
              "<div>" +
                "<h3>" + escHtml(String(card.title || "Untitled")) + "</h3>" +
                "<p class='mono ai-news-meta'>" +
                  escHtml(String(card.company || "Unknown")) + " · " +
                  escHtml(String(card.category || "news")) + " · " +
                  escHtml(formatDate(card.published_at || card.last_checked_at)) +
                "</p>" +
              "</div>" +
              "<span class='config-badge' data-state='configured'>Validated</span>" +
            "</div>" +
            "<div class='ai-news-web-summary'>" +
              "<p class='mono ai-news-web-summary-label'>Webpage Content Summary</p>" +
              "<p>" + escHtml(webpageSummary) + "</p>" +
              (cardUrl ? "<a class='ai-news-card-link' href='" + escHtml(cardUrl) + "' target='_blank' rel='noopener noreferrer' title='Open source article'>Open source ↗</a>" : "<p class='ai-news-card-link-unavailable'>URL not available</p>") +
            "</div>" +
            "<div class='prompt-card-tags'>" + chips + "</div>" +
          "</article>";
        }).join("");
      }

      function renderCurrentView() {
        var byBaseFilters = applyFilters(allCards);
        var cloudBaseCards = (Array.isArray(allCards) ? allCards : []).filter(function (card) {
          if (!card || !card.validated) return false;
          var f = readFilters();
          if (f.company && String(card.company || "") !== f.company) return false;
          if (f.category && String(card.category || "") !== f.category) return false;
          if (f.search) {
            var keywords = Array.isArray(card.keywords) ? card.keywords.map(function (k) { return String(k).toLowerCase(); }) : [];
            var haystack = [String(card.title || ""), String(card.summary || ""), String(card.company || ""), String(card.category || ""), keywords.join(" ")].join(" ").toLowerCase();
            if (haystack.indexOf(f.search) === -1) return false;
          }
          return true;
        });

        renderKeywordCloud(buildKeywordCloudFromCards(cloudBaseCards));
        renderCards(byBaseFilters);

        var filter = readFilters();
        var parts = [];
        if (filter.company) parts.push("company=" + filter.company);
        if (filter.category) parts.push("category=" + filter.category);
        if (filter.days) parts.push("last " + filter.days + " days");
        if (filter.search) parts.push("search=" + filter.search);
        if (filter.keyword) parts.push("keyword=" + filter.keyword);
        var suffix = parts.length ? " Filters: " + parts.join(", ") + "." : "";
        setStatus("Showing " + byBaseFilters.length + " validated cards." + suffix, byBaseFilters.length ? "success" : "neutral");
      }

      function hydrateCards(cards) {
        allCards = Array.isArray(cards) ? cards : [];
        populateFilterOptions(allCards);
        renderCurrentView();
      }

      async function loadCards() {
        setStatus("Loading saved validated cards...", "neutral");
        try {
          var days = daysFilterNode ? String(daysFilterNode.value || "") : "";
          var qs = "limit=all" + (days ? "&days=" + encodeURIComponent(days) : "");
          var response = await fetch("/api/news/cards?" + qs);
          if (!response.ok) throw new Error("Failed to load cards");
          var payload = await response.json();
          var loadedCards = Array.isArray(payload.cards) ? payload.cards : [];
          var totalCards = Number(payload.total || loadedCards.length || 0);
          hydrateCards(loadedCards);
          setStatus("Loaded " + loadedCards.length + " cards from news database. Total matching articles: " + totalCards + ".", "success");
        } catch (error) {
          setStatus("Unable to load cards: " + (error instanceof Error ? error.message : "Unknown error"), "error");
        }
      }

      async function discoverLatest() {
        setStatus("Searching latest internet sources, validating URLs, and analyzing keywords...", "neutral");
        try {
          var previouslyLoadedUrls = collectValidatedUrls(allCards, 4000);
          var knownBefore = {};
          previouslyLoadedUrls.forEach(function (u) { knownBefore[u] = true; });

          var refreshOptions = {
            perFeedLimit: 260,
            maxCandidates: 1800,
            includeSeedUrls: false,
            includeGoogleNews: true,
            preferRecentDays: 60,
          };
          setProgressUI(5, "Queued");
          var payload = await runBackgroundRefresh(refreshOptions);
          if (String(payload.status || "") === "cancelled") {
            setStatus("Background retrieval was cancelled.", "neutral");
            return;
          }
          hydrateCards(payload.cards || []);
          var currentValidatedUrls = collectValidatedUrls(payload.cards || [], 4000);
          var newUrlsFromThisRun = currentValidatedUrls.filter(function (u) { return !knownBefore[u]; });
          var result = payload.result || {};
          var newCards = Number(result.stored || 0);
          var retried = Number(result.updated || 0);
          var skipped = Number(result.skipped || 0);
          var validated = Number(result.validated || 0);
          var perFeedLimit = Number(result.perFeedLimit || refreshOptions.perFeedLimit);
          var maxCandidates = Number(result.maxCandidates || refreshOptions.maxCandidates);
          var preferRecentDays = Number(result.preferRecentDays || refreshOptions.preferRecentDays);
          var timelineDaysUsed = Number(result.timelineDaysUsed || 0);
          var refreshSummary =
            "New articles added: " + newCards +
            " · Retried (previously failed): " + retried +
            " · Already in library (skipped): " + skipped +
            " · Validated OK: " + validated +
            " · Feed scan depth: " + perFeedLimit +
            " · Candidate cap: " + maxCandidates +
            " · Recency window: " + preferRecentDays + " days" +
            (timelineDaysUsed ? " · Timeline expanded to: " + timelineDaysUsed + " days." : ".");

          void openWindowPopup({
            title: "Background News Retrieval Summary",
            markdown: [
              "### Retrieval Completed",
              "",
              "- New articles added: **" + newCards + "**",
              "- Retried (previously failed): **" + retried + "**",
              "- Already in library (skipped): **" + skipped + "**",
              "- Validated OK: **" + validated + "**",
              "- Feed scan depth: **" + perFeedLimit + "**",
              "- Candidate cap: **" + maxCandidates + "**",
              "- Recency window: **" + preferRecentDays + " days**",
              timelineDaysUsed ? "- Timeline expanded to: **" + timelineDaysUsed + " days**" : "",
            ].filter(Boolean).join("\n"),
            closeText: "Close",
          });

          if (validated > 0) {
            setStatus(refreshSummary + " Running LLM synthesis...", "success");
            var analysisMeta = await runWeeklyLlmAnalysis(payload.cards || [], newUrlsFromThisRun);
            var tokenInfo = analysisMeta
              ? (" Prompt chars=" + Number(analysisMeta.promptChars || 0) +
                " (~" + Number(analysisMeta.promptTokenEstimate || 0) + " est tokens)" +
                (Number(analysisMeta.upstreamPromptTokens || 0) > 0
                  ? (" · LM Studio prompt_tokens=" + Number(analysisMeta.upstreamPromptTokens || 0) +
                    ", completion_tokens=" + Number(analysisMeta.upstreamCompletionTokens || 0))
                  : ""))
              : "";
            setStatus(refreshSummary + " Weekly LLM report generated. Next LookbackDays=" + getCurrentLookbackDays() + "." + tokenInfo, "success");
          } else {
            incrementLookbackDays();
            setStatus(refreshSummary + " No newly validated sources in this run, so LLM synthesis was skipped. Next LookbackDays=" + getCurrentLookbackDays() + ".", "neutral");
          }
        } catch (error) {
          setStatus("Unable to refresh sources: " + (error instanceof Error ? error.message : "Unknown error"), "error");
        } finally {
          hideProgressUI();
        }
      }

      if (refreshBtn) {
        refreshBtn.addEventListener("click", function () {
          void enqueueNewsAction("Get News", discoverLatest);
        });
      }

      if (applyPromptBtn) {
        applyPromptBtn.addEventListener("click", function () {
          void enqueueNewsAction("Apply", discoverLatest);
        });
      }

      if (reloadBtn) {
        reloadBtn.addEventListener("click", function () {
          void loadCards();
        });
      }

      if (cancelNewsJobBtn) {
        cancelNewsJobBtn.addEventListener("click", function () {
          void cancelBackgroundRefreshJob();
        });
      }

      if (companyFilterNode) {
        companyFilterNode.addEventListener("change", function () {
          renderCurrentView();
        });
      }

      if (categoryFilterNode) {
        categoryFilterNode.addEventListener("change", function () {
          renderCurrentView();
        });
      }

      if (searchNode) {
        searchNode.addEventListener("input", function () {
          renderCurrentView();
        });
      }

      if (customPromptNode) {
        customPromptNode.addEventListener("input", function () {
          persistAiNewsPromptTemplate(customPromptNode.value);
        });
      }

      if (defaultPromptBtn) {
        defaultPromptBtn.addEventListener("click", function () {
          if (!customPromptNode) return;
          customPromptNode.value = getDefaultAiNewsPromptTemplate();
          persistAiNewsPromptTemplate(customPromptNode.value);
          setStatus("Default Get News prompt restored.", "success");
        });
      }

      if (daysFilterNode) {
        daysFilterNode.addEventListener("change", function () {
          void loadCards();
        });
      }

      if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener("click", function () {
          if (companyFilterNode) companyFilterNode.value = "";
          if (categoryFilterNode) categoryFilterNode.value = "";
          if (daysFilterNode) daysFilterNode.value = "";
          if (searchNode) searchNode.value = "";
          selectedKeyword = "";
          void loadCards();
        });
      }

      navLinks.forEach(function (link) {
        if (link.dataset.section === "ai-prompt-engineering") {
          link.addEventListener("click", function () {
            void loadCards();
          });
        }
      });

      initializeAiNewsPromptTemplate();
      void loadCards();
    })();

    // ── helpers ──────────────────────────────────────────────────────────────

    function getLlmConfig() {
      var sk = "prompt-coach.llmStudioSettings";
      var def = { baseUrl: "http://localhost:1234/v1", model: "qwen2.5-7b-instruct", apiKey: "", systemPrompt: "" };
      try { return Object.assign({}, def, JSON.parse(window.localStorage.getItem(sk) || "{}")); }
      catch (_) { return def; }
    }

    function slugifyFileName(value) {
      var base = String(value || "prompt-content").toLowerCase();
      base = base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      return base || "prompt-content";
    }

    function toIsoDateStamp(d) {
      var date = d instanceof Date ? d : new Date();
      return date.toISOString().slice(0, 10);
    }

    function buildPromptMarkdownExport(title, rawText) {
      var safeTitle = String(title || "Prompt Content").trim() || "Prompt Content";
      var body = String(rawText || "").replace(/\r\n/g, "\n");
      return [
        "# " + safeTitle,
        "",
        "## Metadata",
        "- Exported by: Prompt Coach Mission Control",
        "- Exported at: " + new Date().toISOString(),
        "- Format: Markdown",
        "",
        "## Prompt",
        "```text",
        body,
        "```",
        "",
        "## Enrichment Notes",
        "- Context:",
        "- Constraints:",
        "- Success criteria:",
        "- Revision ideas:"
      ].join("\n");
    }

    function downloadTextAsFile(fileName, textContent) {
      var blob = new Blob([String(textContent || "")], { type: "text/markdown;charset=utf-8" });
      var url = window.URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }

    // renderMarkdown and inlineMarkdown are defined at outer IIFE scope — see below initPromptLibrary

    function tagsFromString(str) {
      return str.split(",").map(function (t) { return t.trim(); }).filter(Boolean);
    }

    // ── API helpers ───────────────────────────────────────────────────────────

    function apiFetch(url, opts) {
      return fetch(url, opts).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      });
    }

    function loadAllPrompts() { return apiFetch("/api/library"); }
    function loadTags() { return apiFetch("/api/library/tags"); }

    function savePrompt(data) {
      return apiFetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }

    function updatePrompt(id, data) {
      return apiFetch("/api/library/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }

    function deletePrompt(id) {
      return apiFetch("/api/library/" + id, { method: "DELETE" });
    }

    // ── Tag cloud & prompt list rendering ────────────────────────────────────

    var allPrompts = [];

    function renderTagCloud(tags) {
      var cloud = document.getElementById("tag-cloud");
      if (!cloud) return;
      var entries = Object.entries(tags).sort(function (a, b) { return b[1] - a[1]; });
      if (!entries.length) {
        cloud.innerHTML = "<span class='tag-empty'>No tags yet. Save a prompt with tags to see them here.</span>";
        return;
      }
      cloud.innerHTML = entries.map(function (e) {
        var name = e[0], count = e[1];
        var weight = Math.min(Math.max(count, 1), 10);
        return "<button class='tag-pill' data-tag='" + escHtml(name) + "' data-weight='" + weight + "'>" +
          escHtml(name) + " <span class='tag-count'>(" + count + ")</span></button>";
      }).join(" ");

      cloud.querySelectorAll(".tag-pill").forEach(function (btn) {
        btn.addEventListener("click", function () {
          openTagModal(btn.dataset.tag);
        });
      });
    }

    function renderPromptsByTag(prompts) {
      var container = document.getElementById("prompts-by-tag");
      if (!container) return;

      // Group by tags
      var groups = {};
      prompts.forEach(function (p) {
        var tags = [];
        try { tags = JSON.parse(p.tags); } catch (_) {}
        if (!tags.length) tags = ["(untagged)"];
        tags.forEach(function (t) {
          if (!groups[t]) groups[t] = [];
          groups[t].push(p);
        });
      });

      var sortedTags = Object.keys(groups).sort();
      if (!sortedTags.length) {
        container.innerHTML = "<p class='lib-empty'>No prompts saved yet. Click <strong>+ New Prompt</strong> to create one.</p>";
        return;
      }

      container.innerHTML = sortedTags.map(function (tag) {
        var cards = groups[tag].map(function (p) {
          var tagsArr = [];
          try { tagsArr = JSON.parse(p.tags); } catch (_) {}
          return "<article class='prompt-card' data-id='" + p.id + "'>" +
            "<div class='prompt-card-header'>" +
              "<strong class='prompt-card-title'>" + escHtml(p.title) + "</strong>" +
              "<div class='prompt-card-actions'>" +
                "<button class='btn secondary' data-action='edit' data-id='" + p.id + "'>Edit</button>" +
                "<button class='btn secondary' data-action='copy' data-id='" + p.id + "'>Copy</button>" +
                "<button class='btn danger' data-action='delete' data-id='" + p.id + "'>Delete</button>" +
              "</div>" +
            "</div>" +
            "<pre class='prompt-card-preview'>" + escHtml(p.content.slice(0, 200)) + (p.content.length > 200 ? "\u2026" : "") + "</pre>" +
            "<div class='prompt-card-tags'>" +
              tagsArr.map(function (t) { return "<span class='tag-chip'>" + escHtml(t) + "</span>"; }).join("") +
            "</div>" +
          "</article>";
        }).join("");

        return "<section class='tag-group'>" +
          "<h3 class='tag-group-title'><span class='tag-chip'>" + escHtml(tag) + "</span></h3>" +
          "<div class='tag-group-cards'>" + cards + "</div>" +
        "</section>";
      }).join("");

      // Bind card action buttons
      container.querySelectorAll("[data-action]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = Number(btn.dataset.id);
          var action = btn.dataset.action;
          var p = allPrompts.find(function (x) { return x.id === id; });
          if (!p) return;
          if (action === "edit") openEditModal(p);
          if (action === "copy") copyText(p.content, btn);
          if (action === "delete") confirmDelete(id);
        });
      });
    }

    function copyText(text, btn) {
      navigator.clipboard.writeText(text).then(function () {
        var orig = btn ? btn.textContent : "";
        if (btn) { btn.textContent = "Copied!"; setTimeout(function () { btn.textContent = orig; }, 1500); }
      }).catch(function () {
        // Fallback
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        if (btn) { btn.textContent = "Copied!"; setTimeout(function () { btn.textContent = "Copy"; }, 1500); }
      });
    }

    function confirmDelete(id) {
      openWindowPopup({
        title: "Confirm Delete",
        markdown: "### Delete Prompt\nThis action **cannot be undone**.\n\nDo you want to continue?",
        kind: "confirm",
      }).then(function (ok) {
        if (!ok) return;
        deletePrompt(id).then(function () {
          loadLibrary();
          updateStatus("Prompt deleted");
          void openWindowPopup({
            title: "Prompt Deleted",
            markdown: "The prompt was removed successfully.",
            kind: "notice",
          });
        }).catch(function (err) {
          void openWindowPopup({
            title: "Delete Failed",
            markdown: "### Delete Failed\n```text\n" + String(err && err.message ? err.message : err) + "\n```",
            kind: "notice",
            tone: "error",
          });
        });
      });
    }

    function loadLibrary() {
      Promise.all([loadAllPrompts(), loadTags()]).then(function (results) {
        allPrompts = results[0].prompts || [];
        renderTagCloud(results[1].tags || {});
        renderPromptsByTag(allPrompts);
        applyLibSearch();
      }).catch(function (err) {
        var c = document.getElementById("prompts-by-tag");
        if (c) c.innerHTML = "<p class='lib-empty' style='color:red'>Failed to load library: " + escHtml(String(err && err.message ? err.message : err)) + "</p>";
      });
    }

    function applyLibSearch() {
      var q = (document.getElementById("lib-search") || {}).value || "";
      q = q.toLowerCase().trim();
      if (!q) { renderPromptsByTag(allPrompts); return; }
      var filtered = allPrompts.filter(function (p) {
        var tags = [];
        try { tags = JSON.parse(p.tags); } catch (_) {}
        return p.title.toLowerCase().includes(q) ||
               p.content.toLowerCase().includes(q) ||
               tags.some(function (t) { return t.toLowerCase().includes(q); });
      });
      renderPromptsByTag(filtered);
    }

    var libSearch = document.getElementById("lib-search");
    if (libSearch) {
      libSearch.addEventListener("input", applyLibSearch);
    }

    var libNewBtn = document.getElementById("lib-new-btn");
    if (libNewBtn) {
      libNewBtn.addEventListener("click", function () { openEditModal(null); });
    }

    // ── Modal helpers ─────────────────────────────────────────────────────────

    function makeResizable(modal, handle) {
      if (!modal || !handle) return;
      var startX, startY, startW, startH;

      handle.addEventListener("mousedown", function (e) {
        if (modal.classList.contains("is-maximized")) return;
        e.preventDefault();
        startX = e.clientX; startY = e.clientY;
        startW = modal.offsetWidth; startH = modal.offsetHeight;

        function onMove(ev) {
          var w = Math.max(320, startW + ev.clientX - startX);
          var h = Math.max(200, startH + ev.clientY - startY);
          modal.style.width = w + "px";
          modal.style.height = h + "px";
          modal.style.maxWidth = "none";
          modal.style.maxHeight = "none";
        }
        function onUp() {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        }
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });
    }

    function makeDraggable(modal, titlebar) {
      if (!modal || !titlebar) return;
      var ox, oy;

      titlebar.addEventListener("mousedown", function (e) {
        if (modal.classList.contains("is-maximized")) return;
        if (e.target.tagName === "BUTTON") return;
        e.preventDefault();
        var rect = modal.getBoundingClientRect();
        ox = e.clientX - rect.left;
        oy = e.clientY - rect.top;
        modal.style.position = "fixed";

        function onMove(ev) {
          modal.style.left = (ev.clientX - ox) + "px";
          modal.style.top = (ev.clientY - oy) + "px";
          modal.style.transform = "none";
          modal.style.margin = "0";
        }
        function onUp() {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        }
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });
    }

    var SIZE_PRESETS = {
      small:  { width: "min(480px, 95vw)",  height: "min(380px, 85vh)" },
      medium: { width: "min(700px, 95vw)",  height: "min(580px, 88vh)" },
      large:  { width: "100vw",             height: "100vh" },
    };

    function applySize(modal, size) {
      var preset = SIZE_PRESETS[size];
      if (!preset) return;
      modal.style.width = preset.width;
      modal.style.height = preset.height;
      modal.style.maxWidth = "none";
      modal.style.maxHeight = "none";
    }

    function bindSizeButtons(modal) {
      modal.querySelectorAll(".lib-size-btn").forEach(function (btn) {
        btn.addEventListener("click", function () { applySize(modal, btn.dataset.size); });
      });
    }

    function maximizeModal(modal, maxBtn) {
      if (!modal || modal.classList.contains("is-maximized")) return;
      modal.dataset.prevLeft = modal.style.left || "";
      modal.dataset.prevTop = modal.style.top || "";
      modal.dataset.prevRight = modal.style.right || "";
      modal.dataset.prevBottom = modal.style.bottom || "";
      modal.dataset.prevW = modal.style.width || "";
      modal.dataset.prevH = modal.style.height || "";
      modal.dataset.prevMaxW = modal.style.maxWidth || "";
      modal.dataset.prevMaxH = modal.style.maxHeight || "";
      modal.dataset.prevTransform = modal.style.transform || "";
      modal.dataset.prevMargin = modal.style.margin || "";
      modal.dataset.prevRadius = modal.style.borderRadius || "";

      modal.classList.add("is-maximized");
      modal.style.position = "fixed";
      modal.style.left = "0";
      modal.style.top = "0";
      modal.style.right = "0";
      modal.style.bottom = "0";
      modal.style.width = "100vw";
      modal.style.height = "100vh";
      modal.style.maxWidth = "100vw";
      modal.style.maxHeight = "100vh";
      modal.style.transform = "none";
      modal.style.margin = "0";
      modal.style.borderRadius = "0";

      if (maxBtn) {
        maxBtn.title = "Restore";
        maxBtn.textContent = "❐";
      }
    }

    function restoreModal(modal, maxBtn) {
      if (!modal || !modal.classList.contains("is-maximized")) return;
      modal.classList.remove("is-maximized");
      modal.style.left = modal.dataset.prevLeft || "";
      modal.style.top = modal.dataset.prevTop || "";
      modal.style.right = modal.dataset.prevRight || "";
      modal.style.bottom = modal.dataset.prevBottom || "";
      modal.style.width = modal.dataset.prevW || "";
      modal.style.height = modal.dataset.prevH || "";
      modal.style.maxWidth = modal.dataset.prevMaxW || "";
      modal.style.maxHeight = modal.dataset.prevMaxH || "";
      modal.style.transform = modal.dataset.prevTransform || "";
      modal.style.margin = modal.dataset.prevMargin || "";
      modal.style.borderRadius = modal.dataset.prevRadius || "";

      if (maxBtn) {
        maxBtn.title = "Maximise";
        maxBtn.textContent = "□";
      }
    }

    function bindMinMax(modal, minBtn, maxBtn) {
      if (!modal) return;
      var savedH = null;

      if (minBtn) {
        minBtn.addEventListener("click", function () {
          var body = modal.querySelector(".lib-modal-body");
          var sizeBar = modal.querySelector(".lib-modal-size-bar");
          var handle = modal.querySelector(".lib-modal-resize-handle");
          var chat = modal.querySelector(".chat-body");
          if (!body) return;
          var isMin = body.hidden;
          body.hidden = !isMin;
          if (sizeBar) sizeBar.hidden = !isMin;
          if (handle) handle.hidden = !isMin;
          if (chat) chat.hidden = !isMin;
          if (!isMin) savedH = modal.style.height;
          modal.style.height = isMin ? (savedH || "") : "auto";
          minBtn.title = isMin ? "Minimise" : "Restore";
          minBtn.textContent = isMin ? "─" : "⬛";
        });
      }

      if (maxBtn) {
        maxBtn.addEventListener("click", function () {
          if (!modal.classList.contains("is-maximized")) {
            maximizeModal(modal, maxBtn);
          } else {
            restoreModal(modal, maxBtn);
          }
        });
      }
    }

    function isModalOpen(modal) {
      return Boolean(modal && !modal.hidden);
    }

    function syncModalBackdrop() {
      if (!tagModalBack) return;
      // Shared backdrop for all prompt-library popups.
      tagModalBack.hidden = !(isModalOpen(tagModal) || isModalOpen(editModal) || isModalOpen(windowPopupModal));
    }

    // ── Tag popup modal ───────────────────────────────────────────────────────

    var tagModal        = document.getElementById("lib-modal");
    var tagModalBack    = document.getElementById("lib-modal-backdrop");
    var tagModalBody    = document.getElementById("lib-modal-body");
    var tagModalTitle   = document.getElementById("lib-modal-title");
    var tagModalClose   = document.getElementById("lib-modal-close");
    var tagModalMin     = document.getElementById("lib-modal-min");
    var tagModalMax     = document.getElementById("lib-modal-max");
    var tagModalTitleBar = document.getElementById("lib-modal-titlebar");
    var tagModalResize  = document.getElementById("lib-modal-resize");

    var editModal       = document.getElementById("prompt-edit-modal");
    var editForm        = document.getElementById("prompt-edit-form");
    var editIdField     = document.getElementById("prompt-edit-id");
    var editTitleInp    = document.getElementById("prompt-edit-title-input");
    var editContent     = document.getElementById("prompt-edit-content");
    var editTagsInp     = document.getElementById("prompt-edit-tags");
    var editFeedback    = document.getElementById("prompt-edit-feedback");
    var editClose       = document.getElementById("prompt-edit-close");
    var editCancel      = document.getElementById("prompt-edit-cancel");
    var editMin         = document.getElementById("prompt-edit-min");
    var editMax         = document.getElementById("prompt-edit-max");
    var editTitleBar    = document.getElementById("prompt-edit-titlebar");
    var editResize      = document.getElementById("prompt-edit-resize");

    makeResizable(tagModal, tagModalResize);
    makeDraggable(tagModal, tagModalTitleBar);
    bindMinMax(tagModal, tagModalMin, tagModalMax);
    if (tagModal) bindSizeButtons(tagModal);

    makeResizable(editModal, editResize);
    makeDraggable(editModal, editTitleBar);
    bindMinMax(editModal, editMin, editMax);
    if (editModal) bindSizeButtons(editModal);

    var windowPopupModal = document.getElementById("window-popup-modal");
    var windowPopupTitle = document.getElementById("window-popup-title");
    var windowPopupBody = document.getElementById("window-popup-body");
    var windowPopupActions = document.getElementById("window-popup-actions");
    var windowPopupMin = document.getElementById("window-popup-min");
    var windowPopupMax = document.getElementById("window-popup-max");
    var windowPopupTitlebar = document.getElementById("window-popup-titlebar");
    var windowPopupResize = document.getElementById("window-popup-resize");
    var windowPopupClose = document.getElementById("window-popup-close");
    var windowPopupResolver = null;

    makeResizable(windowPopupModal, windowPopupResize);
    makeDraggable(windowPopupModal, windowPopupTitlebar);
    bindMinMax(windowPopupModal, windowPopupMin, windowPopupMax);
    if (windowPopupModal) bindSizeButtons(windowPopupModal);

    function closeWindowPopup(result) {
      if (!windowPopupModal) return;
      windowPopupModal.hidden = true;
      windowPopupModal.setAttribute("aria-hidden", "true");
      if (windowPopupResolver) {
        windowPopupResolver(Boolean(result));
        windowPopupResolver = null;
      }
      syncModalBackdrop();
    }

    function openWindowPopup(opts) {
      if (!windowPopupModal || !windowPopupBody || !windowPopupActions) return Promise.resolve(false);
      var cfg = opts && typeof opts === "object" ? opts : {};
      if (windowPopupTitle) windowPopupTitle.textContent = cfg.title || "Notice";
      windowPopupBody.innerHTML = renderMarkdown(String(cfg.markdown || ""));
      windowPopupBody.className = "window-popup-body" + (cfg.tone === "error" ? " error" : "");

      windowPopupActions.innerHTML = "";
      if (cfg.kind === "confirm") {
        var cancelBtn = document.createElement("button");
        cancelBtn.className = "btn secondary";
        cancelBtn.type = "button";
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", function () { closeWindowPopup(false); });

        var okBtn = document.createElement("button");
        okBtn.className = "btn primary";
        okBtn.type = "button";
        okBtn.textContent = "Confirm";
        okBtn.addEventListener("click", function () { closeWindowPopup(true); });

        windowPopupActions.appendChild(cancelBtn);
        windowPopupActions.appendChild(okBtn);
      } else {
        if (cfg.enableDownload) {
          var downloadBtn = document.createElement("button");
          downloadBtn.className = "btn secondary";
          downloadBtn.type = "button";
          downloadBtn.textContent = "Download";
          downloadBtn.addEventListener("click", function () {
            var exportTitle = cfg.downloadTitle || cfg.title || "Prompt Content";
            var exportBody = cfg.downloadRaw || cfg.markdown || "";
            var markdown = buildPromptMarkdownExport(exportTitle, exportBody);
            var fileName = slugifyFileName(exportTitle) + "-" + toIsoDateStamp() + ".md";
            downloadTextAsFile(fileName, markdown);
          });
          windowPopupActions.appendChild(downloadBtn);
        }

        var closeBtn = document.createElement("button");
        closeBtn.className = "btn primary";
        closeBtn.type = "button";
        closeBtn.textContent = cfg.closeText || "OK";
        closeBtn.addEventListener("click", function () { closeWindowPopup(true); });
        windowPopupActions.appendChild(closeBtn);
      }

      windowPopupModal.hidden = false;
      windowPopupModal.removeAttribute("aria-hidden");
      syncModalBackdrop();
      maximizeModal(windowPopupModal, windowPopupMax);

      return new Promise(function (resolve) {
        windowPopupResolver = resolve;
      });
    }

    if (windowPopupClose) {
      windowPopupClose.addEventListener("click", function () { closeWindowPopup(false); });
    }
    if (windowPopupModal) {
      windowPopupModal.addEventListener("mousedown", function (e) {
        if (e.target === windowPopupModal) closeWindowPopup(false);
      });
    }

    function openTagModal(tag) {
      if (!tagModal || !tagModalTitle || !tagModalBody || !tagModalClose) return;
      tagModalTitle.textContent = "#" + tag;
      var tagged = allPrompts.filter(function (p) {
        var tags = [];
        try { tags = JSON.parse(p.tags); } catch (_) {}
        return tags.includes(tag);
      });

      if (!tagged.length) {
        tagModalBody.innerHTML = "<p class='lib-empty'>No prompts tagged <strong>" + escHtml(tag) + "</strong>.</p>";
      } else {
        tagModalBody.innerHTML = tagged.map(function (p) {
          var tagsArr = [];
          try { tagsArr = JSON.parse(p.tags || "[]"); } catch (_) {}
          var tagsHtml = tagsArr.length
            ? "<div class='prompt-card-tags'>" + tagsArr.map(function (t) {
                return "<span class='tag-chip'>" + escHtml(t) + "</span>";
              }).join("") + "</div>"
            : "";
          return "<div class='modal-prompt-item'>" +
            "<div class='modal-prompt-header'>" +
              "<strong>" + escHtml(p.title) + "</strong>" +
              "<div>" +
                "<button class='btn secondary' data-copy='" + p.id + "'>Copy</button>" +
                "<button class='btn secondary' data-edit='" + p.id + "'>Edit</button>" +
                "<button class='btn secondary' data-view='" + p.id + "'>View</button>" +
              "</div>" +
            "</div>" +
            "<div class='modal-prompt-content md-content'>" + renderMarkdown(p.content) + "</div>" +
            tagsHtml +
          "</div>";
        }).join("");

        tagModalBody.querySelectorAll("[data-copy]").forEach(function (btn) {
          var p = tagged.find(function (x) { return x.id === Number(btn.dataset.copy); });
          if (p) btn.addEventListener("click", function () { copyText(p.content, btn); });
        });
        tagModalBody.querySelectorAll("[data-edit]").forEach(function (btn) {
          var p = tagged.find(function (x) { return x.id === Number(btn.dataset.edit); });
          if (p) btn.addEventListener("click", function () { closeTagModal(); openEditModal(p); });
        });
        tagModalBody.querySelectorAll("[data-view]").forEach(function (btn) {
          var p = tagged.find(function (x) { return x.id === Number(btn.dataset.view); });
          if (!p) return;
          btn.addEventListener("click", function () {
            void openWindowPopup({
              title: p.title || "Prompt Content Viewer",
              markdown: "```text\n" + String(p.content || "") + "\n```",
              closeText: "Close",
              enableDownload: true,
              downloadRaw: String(p.content || ""),
              downloadTitle: p.title || "prompt-content"
            });
          });
        });
      }

      tagModal.hidden = false;
      tagModal.removeAttribute("aria-hidden");
      syncModalBackdrop();
      maximizeModal(tagModal, tagModalMax);
      tagModalClose.focus();
    }

    function closeTagModal() {
      if (tagModal) { tagModal.hidden = true; tagModal.setAttribute("aria-hidden", "true"); }
      syncModalBackdrop();
    }

    function openEditModal(prompt) {
      if (!editModal || !editTitleInp || !editContent || !editTagsInp) return;
      editTitleInp.value = prompt ? prompt.title : "";
      editContent.value = prompt ? prompt.content : "";
      var tags = [];
      if (prompt) { try { tags = JSON.parse(prompt.tags); } catch (_) {} }
      editTagsInp.value = tags.join(", ");
      if (editFeedback) editFeedback.textContent = "";
      editModal.hidden = false;
      editModal.removeAttribute("aria-hidden");
      syncModalBackdrop();
      maximizeModal(editModal, editMax);
      editTitleInp.focus();
    }

    function closeEditModal() {
      if (editModal) { editModal.hidden = true; editModal.setAttribute("aria-hidden", "true"); }
      syncModalBackdrop();
    }

    if (editClose) editClose.addEventListener("click", closeEditModal);
    if (editCancel) editCancel.addEventListener("click", closeEditModal);
    if (editModal) {
      editModal.addEventListener("mousedown", function (e) {
        if (e.target === editModal) closeEditModal();
      });
    }

    // Failsafe close wiring for all popup controls.
    document.addEventListener("click", function (e) {
      var el = e.target;
      if (!el || typeof el.closest !== "function") return;
      var closeControl = el.closest("[data-close-popup]");
      if (!closeControl) return;

      var popupId = closeControl.getAttribute("data-close-popup");
      if (!popupId) return;

      if (popupId === "lib-modal") {
        closeTagModal();
        return;
      }
      if (popupId === "prompt-edit-modal") {
        closeEditModal();
      }
    });

    if (editForm) {
      editForm.addEventListener("submit", function (e) {
        if (!editIdField || !editTitleInp || !editContent || !editTagsInp) return;
        e.preventDefault();
        var id = editIdField.value ? Number(editIdField.value) : null;
        var data = {
          title: editTitleInp.value.trim(),
          content: editContent.value.trim(),
          tags: tagsFromString(editTagsInp.value),
        };
        if (!data.title || !data.content) {
          if (editFeedback) { editFeedback.textContent = "Title and content are required."; editFeedback.dataset.tone = "error"; }
          return;
        }
        var op = id ? updatePrompt(id, data) : savePrompt(data);
        op.then(function () {
          closeEditModal();
          loadLibrary();
          updateStatus(id ? "Prompt updated" : "Prompt saved");
        }).catch(function (err) {
          if (editFeedback) { editFeedback.textContent = "Save failed: " + (err && err.message ? err.message : String(err)); editFeedback.dataset.tone = "error"; }
        });
      });
    }

    // ── Chatbot ───────────────────────────────────────────────────────────────

    var chatMessages  = document.getElementById("chat-messages");
    var chatInput     = document.getElementById("chat-input");
    var chatSendBtn   = document.getElementById("chat-send-btn");
    var chatClearBtn  = document.getElementById("chat-clear-btn");
    var chatSaveBtn   = document.getElementById("chat-save-btn");
    var chatStatus    = document.getElementById("chat-status");
    var chatSysPrompt = document.getElementById("chat-system-prompt");

    var chatHistory = []; // { role, content }
    var lastAssistantReply = "";

    function appendChatMessage(role, content) {
      if (!chatMessages) return;
      var div = document.createElement("div");
      div.className = "chat-message chat-message--" + role;
      var label = role === "user" ? "You" : "Assistant";
      var bodyHtml = role === "assistant"
        ? "<div class='chat-bubble chat-bubble-md'>" + renderMarkdown(content) +
          "<button class='btn secondary chat-copy-btn'>Copy</button></div>"
        : "<div class='chat-bubble'><pre>" + escHtml(content) + "</pre></div>";
      div.innerHTML = "<span class='chat-role'>" + escHtml(label) + "</span>" + bodyHtml;
      if (role === "assistant") {
        div.querySelector(".chat-copy-btn").addEventListener("click", function () {
          copyText(content, div.querySelector(".chat-copy-btn"));
        });
      }
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function setChatStatus(msg, tone) {
      if (!chatStatus) return;
      chatStatus.textContent = msg;
      chatStatus.dataset.tone = tone || "neutral";
    }

    async function sendChat() {
      var userText = chatInput ? chatInput.value.trim() : "";
      if (!userText) return;

      var cfg = getLlmConfig();
      var base = (cfg.baseUrl || "http://localhost:1234/v1").replace(/\/$/, "");
      var endpoint = buildLlmEndpoint(base, "/chat/completions");

      chatHistory.push({ role: "user", content: userText });
      void sendEventLog({
        level: "info",
        category: "query",
        message: "User submitted chat query",
        component: "client",
        userContext: "prompt-library-chat",
        details: {
          query: userText,
          chars: userText.length,
          historySize: chatHistory.length,
        },
      });
      appendChatMessage("user", userText);
      if (chatInput) chatInput.value = "";
      if (chatSendBtn) chatSendBtn.disabled = true;
      setChatStatus("Waiting for LLM Studio...", "neutral");

      var sysPrompt = (chatSysPrompt && chatSysPrompt.value.trim()) || cfg.systemPrompt || "You are a helpful assistant.";
      var messages = [{ role: "system", content: sysPrompt }].concat(chatHistory);
      void sendEventLog({
        level: "debug",
        category: "processing_step",
        message: "Prepared LLM chat payload",
        component: "client",
        details: {
          model: cfg.model,
          messageCount: messages.length,
        },
      });

      try {
        var headers = { "Content-Type": "application/json" };
        if (cfg.apiKey) headers["Authorization"] = "Bearer " + cfg.apiKey;

        var resp = await fetch(endpoint, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ model: cfg.model, messages: messages, stream: false }),
        });

        void sendEventLog({
          level: resp.ok ? "info" : "warn",
          category: "llm_call",
          message: "Prompt Library chat LLM call completed",
          component: "client",
          endpoint: endpoint,
          method: "POST",
          statusCode: resp.status,
          responseType: "json",
          details: {
            model: cfg.model,
            query: userText,
          },
        });

        if (!resp.ok) {
          var errorDetails = "";
          try {
            var errorText = await resp.text();
            if (errorText) {
              errorDetails = errorText.slice(0, 240);
            }
          } catch {
            errorDetails = "";
          }

          if (resp.status === 401) {
            throw new Error("HTTP 401 Unauthorized: check Base URL/API key in Settings");
          }

          throw new Error("HTTP " + resp.status + (errorDetails ? ": " + errorDetails : ""));
        }
        var json = await resp.json();
        var usage = json && json.usage ? json.usage : {};
        var reply = ((json.choices || [])[0] || {}).message || {};
        var content = reply.content || "(empty response)";
        var responseType = "unknown";
        try {
          JSON.parse(content);
          responseType = "json";
        } catch {
          responseType = content && content.trim() ? "text" : "empty";
        }
        void sendEventLog({
          level: "info",
          category: "llm_call",
          message: "Prompt Library chat response parsed",
          component: "client",
          endpoint: endpoint,
          method: "POST",
          statusCode: resp.status,
          tokensIn: Number(usage.prompt_tokens || 0),
          tokensOut: Number(usage.completion_tokens || 0),
          responseType: responseType,
          details: {
            model: cfg.model,
            usage: usage,
            responseChars: content.length,
          },
        });
        lastAssistantReply = content;
        chatHistory.push({ role: "assistant", content: content });
        appendChatMessage("assistant", content);
        setChatStatus("Response received.", "success");
      } catch (err) {
        var chatErrMsg = err && err.message ? err.message : String(err);
        setChatStatus("Error: " + chatErrMsg, "error");
        void sendEventLog({
          level: "error",
          category: "llm_call",
          message: "Prompt Library chat LLM call failed",
          component: "client",
          endpoint: endpoint,
          method: "POST",
          details: {
            model: cfg.model,
            query: userText,
            error: err && err.message ? err.message : String(err),
          },
        });
        chatHistory.pop(); // remove user message from history on failure
      } finally {
        if (chatSendBtn) chatSendBtn.disabled = false;
        if (chatInput) chatInput.focus();
      }
    }

    if (chatSendBtn) chatSendBtn.addEventListener("click", function () { void sendChat(); });
    if (chatInput) {
      chatInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void sendChat(); }
      });
    }

    if (chatClearBtn) {
      chatClearBtn.addEventListener("click", function () {
        chatHistory = []; lastAssistantReply = "";
        if (chatMessages) chatMessages.innerHTML = "";
        setChatStatus("Chat cleared.", "neutral");
      });
    }

    if (chatSaveBtn) {
      chatSaveBtn.addEventListener("click", function () {
        var content = lastAssistantReply || (chatInput ? chatInput.value.trim() : "");
        if (!content) { setChatStatus("Nothing to save yet.", "error"); return; }
        openEditModal({ id: null, title: "Chat prompt " + new Date().toLocaleTimeString(), content: content, tags: "[]" });
      });
    }

    // Sync settings system-prompt into chat system-prompt on first open
    var savedCfg = getLlmConfig();
    if (chatSysPrompt && !chatSysPrompt.value && savedCfg.systemPrompt) {
      chatSysPrompt.value = savedCfg.systemPrompt;
    }

  })(); // end initPromptLibrary

  // ── Shared markdown helpers (used by both Prompt Library and Help Library) ──

  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function inlineMarkdown(str) {
    var tokens = [];
    var remaining = str;
    // Pass 1: extract [text](url) and ![alt](url) patterns
    var linkRe = /(!?)\[([^\]]*)\]\(([^)]*)\)/g;
    var lastIdx = 0;
    var m;
    linkRe.lastIndex = 0;
    while ((m = linkRe.exec(remaining)) !== null) {
      if (m.index > lastIdx) tokens.push({ type: "text", value: remaining.slice(lastIdx, m.index) });
      tokens.push({ type: m[1] === "!" ? "img" : "link", alt: m[2], href: m[3] });
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < remaining.length) tokens.push({ type: "text", value: remaining.slice(lastIdx) });

    // Pass 2: split text tokens on bare URLs (https:// or http://)
    var bareUrlRe = /https?:\/\/[^\s\)\]\>"']+/g;
    var expanded = [];
    tokens.forEach(function (tok) {
      if (tok.type !== "text") { expanded.push(tok); return; }
      var s = tok.value;
      var li = 0;
      var bm;
      bareUrlRe.lastIndex = 0;
      while ((bm = bareUrlRe.exec(s)) !== null) {
        if (bm.index > li) expanded.push({ type: "text", value: s.slice(li, bm.index) });
        expanded.push({ type: "link", alt: bm[0], href: bm[0] });
        li = bm.index + bm[0].length;
      }
      if (li < s.length) expanded.push({ type: "text", value: s.slice(li) });
    });
    tokens = expanded;

    function sanitizeUrl(url) {
      var u = String(url || "").trim();
      if (/^javascript:/i.test(u)) return "#";
      return u;
    }

    function applyTextStyles(s) {
      s = escHtml(s);
      s = s.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
      s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      s = s.replace(/__(.+?)__/g, "<strong>$1</strong>");
      s = s.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
      s = s.replace(/_([^_\n]+)_/g, "<em>$1</em>");
      s = s.replace(/~~(.+?)~~/g, "<del>$1</del>");
      s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
      return s;
    }

    var result = "";
    tokens.forEach(function (tok) {
      if (tok.type === "text") {
        result += applyTextStyles(tok.value);
      } else if (tok.type === "link") {
        var href = sanitizeUrl(tok.href);
        var linkText = applyTextStyles(tok.alt);
        result += "<a href='" + escHtml(href) + "' target='_blank' rel='noopener noreferrer'>" + linkText + "</a>";
      } else if (tok.type === "img") {
        result += "<img src='" + escHtml(sanitizeUrl(tok.href)) + "' alt='" +
          escHtml(tok.alt) + "' loading='lazy' style='max-width:100%;height:auto;border-radius:6px;'>";
      }
    });
    return result;
  }

  function renderMarkdown(src) {
    var text = String(src || "");
    text = text.replace(/```([^\n]*)\n([\s\S]*?)```/g, function (_, lang, code) {
      var cls = lang ? " class=\"language-" + escHtml(lang.trim()) + "\"" : "";
      return "<pre><code" + cls + ">" + escHtml(code.replace(/\n$/, "")) + "</code></pre>";
    });
    var lines = text.split("\n");
    var html = "";
    var inList = null;
    var inBlockquote = false;
    var paraLines = [];
    function flushPara() {
      if (!paraLines.length) return;
      var p = paraLines.join(" ").trim();
      if (p) html += "<p>" + inlineMarkdown(p) + "</p>";
      paraLines = [];
    }
    function closeList() {
      if (inList) { html += "</" + inList + ">"; inList = null; }
    }
    function closeBlockquote() {
      if (inBlockquote) { html += "</blockquote>"; inBlockquote = false; }
    }
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.startsWith("<pre>") || line.startsWith("</pre>") ||
          line.startsWith("<pre><code") || line === "</code></pre>") {
        flushPara(); closeList(); closeBlockquote();
        html += line + "\n";
        continue;
      }
      if (/^(\*\*\*|---|___)(\s*)$/.test(line)) {
        flushPara(); closeList(); closeBlockquote();
        html += "<hr>";
        continue;
      }
      var hMatch = line.match(/^(#{1,6})\s+(.*)/);
      if (hMatch) {
        flushPara(); closeList(); closeBlockquote();
        var level = hMatch[1].length;
        html += "<h" + level + ">" + inlineMarkdown(hMatch[2]) + "</h" + level + ">";
        continue;
      }
      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|[\s\-:|]+\|/.test(lines[i + 1])) {
        flushPara(); closeList(); closeBlockquote();
        var headers = line.split("|").slice(1, -1).map(function (c) { return c.trim(); });
        i++;
        var sepCols = lines[i].split("|").slice(1, -1).map(function (c) { return c.trim(); });
        var aligns = sepCols.map(function (c) {
          if (/^:-+:$/.test(c)) return "center";
          if (/-+:$/.test(c)) return "right";
          return "left";
        });
        html += "<table><thead><tr>";
        headers.forEach(function (h, idx) {
          html += "<th style=\"text-align:" + (aligns[idx] || "left") + "\">" + inlineMarkdown(h) + "</th>";
        });
        html += "</tr></thead><tbody>";
        i++;
        while (i < lines.length && /^\s*\|/.test(lines[i])) {
          var cells = lines[i].split("|").slice(1, -1).map(function (c) { return c.trim(); });
          html += "<tr>";
          for (var ci = 0; ci < headers.length; ci++) {
            html += "<td style=\"text-align:" + (aligns[ci] || "left") + "\">" + inlineMarkdown(cells[ci] !== undefined ? cells[ci] : "") + "</td>";
          }
          html += "</tr>";
          i++;
        }
        i--;
        html += "</tbody></table>";
        continue;
      }
      var bqMatch = line.match(/^>\s?(.*)/);
      if (bqMatch) {
        flushPara(); closeList();
        if (!inBlockquote) { html += "<blockquote>"; inBlockquote = true; }
        html += inlineMarkdown(bqMatch[1]) + " ";
        continue;
      } else if (inBlockquote) {
        closeBlockquote();
      }
      var ulMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
      if (ulMatch) {
        flushPara();
        if (inList !== "ul") { closeList(); html += "<ul>"; inList = "ul"; }
        html += "<li>" + inlineMarkdown(ulMatch[2]) + "</li>";
        continue;
      }
      var olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
      if (olMatch) {
        flushPara();
        if (inList !== "ol") { closeList(); html += "<ol>"; inList = "ol"; }
        html += "<li>" + inlineMarkdown(olMatch[2]) + "</li>";
        continue;
      }
      if (line.trim() === "") {
        flushPara(); closeList(); closeBlockquote();
        continue;
      }
      closeList(); closeBlockquote();
      paraLines.push(line);
    }
    flushPara(); closeList(); closeBlockquote();
    return html;
  }

  // ── Help Library ──────────────────────────────────────────────────────────

  (function initHelpLibrary() {
    var hlPanel = document.getElementById("help-library-panel");
    if (!hlPanel) return;

    allPanels.push(hlPanel);

    var tabBar = document.getElementById("hl-tab-bar");
    var docContent = document.getElementById("hl-doc-content");
    var docListNode = document.getElementById("hl-doc-list");
    if (!tabBar || !docContent || !docListNode) return;

    var hlDocs = [];
    var loaded = false;

    function escapeHtmlSafe(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function renderHelpMarkdown(src) {
      if (typeof renderMarkdown === "function") {
        return renderMarkdown(String(src || ""));
      }
      return "<pre>" + escapeHtmlSafe(String(src || "")) + "</pre>";
    }

    function openDocInPopup(doc) {
      if (!doc) return;
      var title = String((doc && doc.title) || "Help Document");
      var popup = window.open("", "_blank", "popup=yes,width=1120,height=800,noopener,noreferrer");
      if (!popup) return;

      var rendered = renderHelpMarkdown(String((doc && doc.markdown) || ""));
      popup.document.open();
      popup.document.write(
        "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>" +
        "<title>" + escapeHtmlSafe(title) + "</title>" +
        "<style>" +
        "*{box-sizing:border-box;}" +
        "body{margin:0;padding:32px 24px;font-family:Manrope,'Segoe UI',system-ui,sans-serif;background:#f3f7fd;color:#102034;font-size:15px;line-height:1.8;}" +
        ".doc{max-width:900px;margin:0 auto;background:#fff;border:1px solid #cfd9e8;border-radius:14px;padding:36px 44px;}" +
        ".doc h1{font-size:1.9rem;font-weight:800;margin:0 0 20px;color:#0a1e35;border-bottom:2px solid #d6e4f7;padding-bottom:12px;}" +
        ".doc h2{font-size:1.35rem;font-weight:700;margin:36px 0 10px;color:#0a1e35;border-bottom:1px solid #e2ecf8;padding-bottom:6px;}" +
        ".doc h3{font-size:1.1rem;font-weight:700;margin:24px 0 8px;color:#102034;}" +
        ".doc h4{font-size:1rem;font-weight:700;margin:18px 0 6px;color:#1e3a5f;}" +
        ".doc h5,.doc h6{font-size:0.9rem;font-weight:700;margin:14px 0 4px;color:#2a4a6e;text-transform:uppercase;letter-spacing:.04em;}" +
        ".doc p{margin:0 0 16px;color:#2c3e50;}" +
        ".doc ul,.doc ol{margin:0 0 16px;padding-left:1.6em;color:#2c3e50;}" +
        ".doc li{margin-bottom:6px;}" +
        ".doc a{color:#0f6cbf;text-decoration:underline;text-underline-offset:2px;}" +
        ".doc a:hover{color:#0a52a0;}" +
        ".doc code{background:#edf4ff;color:#0a5ca8;padding:2px 6px;border-radius:4px;font-family:'JetBrains Mono','Fira Mono',monospace;font-size:0.87em;}" +
        ".doc pre{background:#f4f8ff;border:1px solid #d0e3f5;border-radius:10px;padding:16px 20px;overflow-x:auto;margin:0 0 20px;}" +
        ".doc pre code{background:none;padding:0;color:#102034;font-size:0.88rem;}" +
        ".doc blockquote{border-left:4px solid #4a90d9;margin:0 0 20px;padding:12px 20px;background:#f4f8ff;border-radius:0 10px 10px 0;color:#2c4a6e;font-style:italic;}" +
        ".doc hr{border:none;border-top:1px solid #d6e4f7;margin:32px 0;}" +
        ".doc table{width:100%;border-collapse:collapse;margin:0 0 24px;font-size:0.9rem;}" +
        ".doc thead{background:#f0f6ff;}" +
        ".doc th{padding:10px 14px;border:1px solid #ccd9ee;font-weight:700;color:#102034;text-align:left;}" +
        ".doc td{padding:9px 14px;border:1px solid #dce8f5;color:#2c3e50;vertical-align:top;}" +
        ".doc tbody tr:nth-child(even){background:#f8fbff;}" +
        ".doc img{max-width:100%;height:auto;border-radius:8px;margin:8px 0;}" +
        ".doc del{color:#888;text-decoration:line-through;}" +
        ".doc strong{font-weight:700;color:#0a1e35;}" +
        "</style></head><body><div class='doc'>" + rendered + "</div></body></html>"
      );
      popup.document.close();
    }

    function makeTabBtn(doc) {
      var btn = document.createElement("button");
      btn.className = "hl-tab";
      btn.type = "button";
      btn.textContent = String((doc && doc.title) || "Document");
      btn.dataset.docId = String((doc && doc.id) || "");
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", "false");
      btn.addEventListener("click", function () { showDoc(btn.dataset.docId); });
      return btn;
    }

    function renderDocList() {
      docListNode.innerHTML = "";
      hlDocs.forEach(function (doc) {
        var item = document.createElement("li");
        item.className = "hl-doc-item";
        item.dataset.docId = String((doc && doc.id) || "");

        var titleBtn = document.createElement("button");
        titleBtn.type = "button";
        titleBtn.className = "hl-doc-open";
        titleBtn.textContent = String((doc && doc.title) || "Document");
        titleBtn.addEventListener("click", function () {
          showDoc(String((doc && doc.id) || ""));
        });

        var popupLink = document.createElement("a");
        popupLink.href = "#";
        popupLink.className = "hl-doc-popup-link";
        popupLink.textContent = "Open in popup window";
        popupLink.addEventListener("click", function (event) {
          event.preventDefault();
          openDocInPopup(doc);
        });

        item.appendChild(titleBtn);
        item.appendChild(popupLink);
        docListNode.appendChild(item);
      });
    }

    function showDoc(id) {
      if (!id) return;
      var doc = hlDocs.find(function (d) { return d.id === id; });
      if (!doc) return;

      Array.from(tabBar.querySelectorAll(".hl-tab")).forEach(function (btn) {
        var active = btn.dataset.docId === id;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
      });

      Array.from(docListNode.querySelectorAll(".hl-doc-item")).forEach(function (item) {
        item.classList.toggle("is-active", item.dataset.docId === id);
      });

      docContent.innerHTML = "<div class='hl-doc-inner'>" + renderHelpMarkdown(String(doc.markdown || "")) + "</div>";
      docContent.scrollTop = 0;
    }

    async function loadHelpDocs() {
      if (loaded) return;
      docContent.innerHTML = "<p class='form-note mono' id='hl-status'>Loading documentation...</p>";
      docListNode.innerHTML = "<li class='hl-doc-item'><span class='form-note mono'>Loading docs list...</span></li>";
      try {
        var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        var timeoutId = null;
        if (controller) {
          timeoutId = window.setTimeout(function () {
            controller.abort();
          }, 15000);
        }

        var response = await fetch("/api/help-library", controller ? { method: "GET", signal: controller.signal } : { method: "GET" });
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        if (!response.ok) throw new Error("HTTP " + response.status);
        var payload = await response.json();
        hlDocs = Array.isArray(payload.docs) ? payload.docs : [];

        if (!hlDocs.length) {
          docContent.innerHTML = "<p class='form-note mono'>No help documents found in the docs/ folder.</p>";
          docListNode.innerHTML = "<li class='hl-doc-item'><span class='form-note mono'>No documents available.</span></li>";
          return;
        }

        // Prefer the focused help file first; keep remaining docs deterministic.
        hlDocs.sort(function (a, b) {
          var aName = String((a && a.fileName) || "").toLowerCase();
          var bName = String((b && b.fileName) || "").toLowerCase();
          if (aName === "help-library.md") return -1;
          if (bName === "help-library.md") return 1;
          return String((a && a.title) || "").localeCompare(String((b && b.title) || ""));
        });

        tabBar.innerHTML = "";
        hlDocs.forEach(function (doc) { tabBar.appendChild(makeTabBtn(doc)); });
        renderDocList();

        loaded = true;
        var defaultDoc = hlDocs.find(function (doc) {
          return String((doc && doc.fileName) || "").toLowerCase() === "help-library.md";
        }) || hlDocs[0];

        window.requestAnimationFrame(function () {
          showDoc(defaultDoc && defaultDoc.id ? defaultDoc.id : "");
        });
      } catch (err) {
        var msg = String(err && err.name === "AbortError"
          ? "Request timed out while loading docs"
          : (err && err.message ? err.message : err));
        docContent.innerHTML = "<p class='form-note mono' style='color:#c0392b'>Failed to load help library: " +
          escapeHtmlSafe(msg) + "</p>";
        docListNode.innerHTML = "<li class='hl-doc-item'><span class='form-note mono' style='color:#c0392b'>Could not load docs list.</span></li>";
      }
    }

    // Intercept showSection to trigger lazy load when Help Library is opened
    var _prevShowSection = showSection;
    showSection = function (section) {
      _prevShowSection(section);
      if (section === "help-library") {
        void loadHelpDocs();
      }
    };
  })(); // end initHelpLibrary

})();

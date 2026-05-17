// Built-in search keeps bundle size minimal for static module delivery in this phase.
export function searchKnowledgeBase(entries, query, options = {}) {
  const limit = options.limit || 20;
  const q = (query || "").trim().toLowerCase();
  if (!q) {
    return [];
  }

  const tokens = q.split(/\s+/).filter((token) => token.length > 1);
  const ranked = [];

  for (const entry of entries || []) {
    const title = String(entry.title || entry.term || "");
    const text = String(entry.text || "");
    const tags = Array.isArray(entry.tags) ? entry.tags.join(" ") : "";

    const titleLower = title.toLowerCase();
    const textLower = text.toLowerCase();
    const tagsLower = tags.toLowerCase();

    let score = 0;
    for (const token of tokens) {
      if (titleLower.includes(token)) {
        score += 8;
      }
      if (tagsLower.includes(token)) {
        score += 5;
      }
      if (textLower.includes(token)) {
        score += 2;
      }
    }

    if (!score) {
      continue;
    }

    ranked.push({
      ...entry,
      score,
      snippet: buildSnippet(text, tokens),
    });
  }

  return ranked.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function highlightText(rawText, query) {
  const text = String(rawText || "");
  const tokens = String(query || "")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1);

  if (!tokens.length) {
    return escapeHtml(text);
  }

  const pattern = tokens.map(escapeRegex).join("|");
  if (!pattern) {
    return escapeHtml(text);
  }

  const regex = new RegExp(`(${pattern})`, "gi");
  return escapeHtml(text).replace(regex, "<mark>$1</mark>");
}

export function buildSnippet(text, tokens) {
  if (!text) {
    return "";
  }

  const lowered = text.toLowerCase();
  let first = -1;
  for (const token of tokens) {
    const at = lowered.indexOf(token);
    if (at >= 0 && (first < 0 || at < first)) {
      first = at;
    }
  }

  if (first < 0) {
    return text.slice(0, 160);
  }

  const start = Math.max(0, first - 50);
  const end = Math.min(text.length, first + 110);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function loadArticleBySlug(slug) {
  const safeSlug = String(slug || "").trim();
  if (!safeSlug) {
    throw new Error("Missing article slug.");
  }

  const url = new URL(`../data/articles/${safeSlug}.md`, import.meta.url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Article not found: ${safeSlug}`);
  }

  const markdown = await response.text();
  const parsed = parseFrontMatter(markdown);
  const html = markdownToHtml(parsed.body);
  const toc = collectToc(parsed.body);

  return {
    slug: safeSlug,
    frontMatter: parsed.frontMatter,
    body: parsed.body,
    html,
    toc,
  };
}

function parseFrontMatter(markdown) {
  const source = String(markdown || "");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontMatter: {}, body: source };
  }

  const frontMatterRaw = match[1] || "";
  const body = match[2] || "";
  const frontMatter = {};

  frontMatterRaw.split(/\r?\n/).forEach((line) => {
    const colon = line.indexOf(":");
    if (colon < 0) {
      return;
    }

    const key = line.slice(0, colon).trim();
    const rawValue = line.slice(colon + 1).trim();
    frontMatter[key] = parseValue(rawValue);
  });

  return { frontMatter, body };
}

function parseValue(value) {
  if (!value) {
    return "";
  }

  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((part) => stripQuotes(part.trim()))
      .filter(Boolean);
  }

  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  return stripQuotes(value);
}

function stripQuotes(value) {
  return String(value).replace(/^['\"]|['\"]$/g, "");
}

function collectToc(markdownBody) {
  const toc = [];
  String(markdownBody || "")
    .split(/\r?\n/)
    .forEach((line) => {
      const heading = line.match(/^##\s+(.+)/);
      if (!heading) {
        return;
      }
      const title = heading[1].trim();
      toc.push({
        title,
        anchor: slugify(title),
      });
    });
  return toc;
}

function markdownToHtml(markdown) {
  const source = String(markdown || "").replace(/\r/g, "");
  const placeholderMap = [];

  const fenced = source.replace(/```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g, (_, lang = "", code = "") => {
    const id = placeholderMap.length;
    placeholderMap.push(renderCodeBlock(code, lang));
    return `@@CODE:${id}@@`;
  });

  const relaxedFenced = fenced.replace(/`([a-zA-Z0-9_-]+)\n([\s\S]*?)`/g, (_, lang = "", code = "") => {
    const id = placeholderMap.length;
    placeholderMap.push(renderCodeBlock(code, lang));
    return `@@CODE:${id}@@`;
  });

  const lines = relaxedFenced.split("\n");
  const out = [];
  let paragraph = [];
  let inUl = false;
  let inOl = false;
  let inTable = false;

  function flushParagraph() {
    if (!paragraph.length) {
      return;
    }
    out.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function closeLists() {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  }

  function closeTable() {
    if (inTable) {
      out.push("</tbody></table>");
      inTable = false;
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      closeLists();
      closeTable();
      continue;
    }

    const codeToken = line.match(/^@@CODE:(\d+)@@$/);
    if (codeToken) {
      flushParagraph();
      closeLists();
      closeTable();
      out.push(placeholderMap[Number(codeToken[1])] || "");
      continue;
    }

    const heading2 = line.match(/^##\s+(.+)/);
    if (heading2) {
      flushParagraph();
      closeLists();
      closeTable();
      const title = heading2[1].trim();
      out.push(`<h2 id="${slugify(title)}">${inline(title)}</h2>`);
      continue;
    }

    const heading3 = line.match(/^###\s+(.+)/);
    if (heading3) {
      flushParagraph();
      closeLists();
      closeTable();
      const title = heading3[1].trim();
      out.push(`<h3 id="${slugify(title)}">${inline(title)}</h3>`);
      continue;
    }

    const quote = line.match(/^>\s+(.+)/);
    if (quote) {
      flushParagraph();
      closeLists();
      closeTable();
      out.push(`<blockquote>${inline(quote[1])}</blockquote>`);
      continue;
    }

    if (line.includes("|") && !line.startsWith("- ")) {
      const next = lines[i + 1] ? lines[i + 1].trim() : "";
      const isHeader = /^\|?\s*:?[-]{3,}:?\s*(\|\s*:?[-]{3,}:?\s*)+\|?$/.test(next);
      if (isHeader) {
        flushParagraph();
        closeLists();
        closeTable();
        const headerCells = splitTableRow(line);
        out.push("<table><thead><tr>" + headerCells.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr></thead><tbody>");
        inTable = true;
        i += 1;
        continue;
      }
      if (inTable) {
        const rowCells = splitTableRow(line);
        out.push("<tr>" + rowCells.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>");
        continue;
      }
    }

    if (/^\|?\s*:?[-]{3,}:?\s*(\|\s*:?[-]{3,}:?\s*)+\|?$/.test(line)) {
      continue;
    }

    const unordered = line.match(/^-\s+(.+)/);
    if (unordered) {
      flushParagraph();
      closeTable();
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${inline(unordered[1])}</li>`);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)/);
    if (ordered) {
      flushParagraph();
      closeTable();
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inline(ordered[1])}</li>`);
      continue;
    }

    if (line === "---") {
      flushParagraph();
      closeLists();
      closeTable();
      out.push("<hr />");
      continue;
    }

    closeTable();

    paragraph.push(line);
  }

  flushParagraph();
  closeLists();
  closeTable();

  return out.join("\n");
}

function splitTableRow(row) {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderCodeBlock(code, lang) {
  const normalized = String(code || "").replace(/^\n+|\n+$/g, "");
  const safeCode = escapeHtml(normalized);
  return (
    '<div class="kb-code-wrapper">' +
    `<div class="kb-code-top"><span class="kb-code-lang">${escapeHtml(lang || "text")}</span><button type="button" class="kb-copy-code">Copy</button></div>` +
    `<pre><code class="kb-code" data-lang="${escapeHtml(lang || "text")}">${safeCode}</code></pre>` +
    "</div>"
  );
}

function inline(text) {
  const safe = escapeHtml(text);
  return safe
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      const isExternal = /^https?:\/\//i.test(href);
      if (isExternal) {
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
      }
      return `<a href="${href}">${label}</a>`;
    });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

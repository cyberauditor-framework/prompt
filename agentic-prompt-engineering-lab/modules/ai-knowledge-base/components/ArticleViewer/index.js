export function mountArticleViewer(options) {
  const { container, article, onHelpful } = options;
  container.innerHTML = renderArticleViewerHtml(article);

  container.querySelectorAll(".kb-helpful button").forEach((button) => {
    button.addEventListener("click", () => {
      const vote = button.getAttribute("data-vote");
      onHelpful(vote === "up" ? "up" : "down");
    });
  });

  wireCodeTools(container);
}

export function renderArticleViewerHtml(article) {
  const meta = article.frontMatter || {};
  const tags = Array.isArray(meta.tags) ? meta.tags : [];

  return (
    '<article class="kb-article">' +
    `<header class="kb-article-header"><h1>${escapeHtml(meta.title || article.slug)}</h1>` +
    `<p class="kb-article-meta">Category: ${escapeHtml(meta.category || "uncategorized")} • Difficulty: ${escapeHtml(meta.difficulty || "n/a")} • ${escapeHtml(String(meta.reading_time_min || "?"))} min read</p>` +
    `<div class="kb-tag-row">${tags.map((tag) => `<span class="kb-chip">${escapeHtml(tag)}</span>`).join("")}</div>` +
    "</header>" +
    `<section class="kb-article-body">${article.html}</section>` +
    '<footer class="kb-helpful">' +
    "<p>Was this helpful?</p>" +
    '<div class="kb-helpful-actions">' +
    '<button type="button" data-vote="up">👍 Yes</button>' +
    '<button type="button" data-vote="down">👎 No</button>' +
    "</div>" +
    "</footer>" +
    "</article>"
  );
}

function wireCodeTools(container) {
  container.querySelectorAll(".kb-copy-code").forEach((button) => {
    button.addEventListener("click", async () => {
      const code = button.closest(".kb-code-wrapper")?.querySelector("code")?.textContent || "";
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = "Copied";
        window.setTimeout(() => {
          button.textContent = "Copy";
        }, 900);
      } catch {
        button.textContent = "Copy failed";
      }
    });
  });

  container.querySelectorAll("code.kb-code").forEach((block) => {
    const lang = (block.getAttribute("data-lang") || "").toLowerCase();
    if (lang === "python") {
      block.innerHTML = highlightPython(block.textContent || "");
    }
  });
}

function highlightPython(code) {
  const safe = escapeHtml(code);
  return safe
    .replace(/\b(def|class|for|while|if|else|elif|return|import|from|as|try|except|with|in|print)\b/g, "<span class=\"kb-py-keyword\">$1</span>")
    .replace(/\b(True|False|None)\b/g, "<span class=\"kb-py-bool\">$1</span>")
    .replace(/(#.*)$/gm, "<span class=\"kb-py-comment\">$1</span>");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

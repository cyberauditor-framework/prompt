import { loadArticleBySlug } from "../../services/articleService.js";
import { getArticleIndexBySlug, getArticlesBySlugs } from "../../services/kbApi.js";
import { mountArticleViewer } from "../../components/ArticleViewer/index.js";
import { mountRelatedArticles } from "../../components/RelatedArticles/index.js";
import {
  mountBookmarkButton,
  mountSavedArticles,
} from "../../components/BookmarkButton/index.js";

const RECENT_KEY = "kb-recent";
const FEEDBACK_KEY = "kb-feedback";

const dom = {
  left: document.getElementById("article-left"),
  content: document.getElementById("article-content"),
  right: document.getElementById("article-right"),
};

void initialize();

async function initialize() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug") || "";

  if (!slug) {
    renderMissing("Missing article slug.");
    return;
  }

  try {
    const article = await loadArticleBySlug(slug);
    const indexRow = await getArticleIndexBySlug(slug);
    document.title = `${article.frontMatter.title || slug} - AI Knowledge Base`;

    writeRecent(slug, article.frontMatter.title || slug);

    mountArticleViewer({
      container: dom.content,
      article,
      onHelpful: (vote) => {
        registerHelpfulVote(slug, vote);
        renderFeedbackSummary(slug);
      },
    });

    renderLeftRail(slug, article.frontMatter.title || slug);
    await renderRightRail(article, indexRow);
    renderFeedbackSummary(slug);

    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([dom.content]).catch(() => {});
    }
  } catch (error) {
    renderMissing(error instanceof Error ? error.message : "Unable to load article.");
  }
}

function renderLeftRail(slug, title) {
  dom.left.innerHTML = '<div id="bookmark-slot"></div><div id="saved-slot"></div><div id="recent-slot"></div>';

  mountBookmarkButton({
    container: dom.left.querySelector("#bookmark-slot"),
    slug,
    title,
    onChange: () => {
      mountSavedArticles({
        container: dom.left.querySelector("#saved-slot"),
        onOpen: (entry) => {
          window.location.href = `./index.html?slug=${encodeURIComponent(entry.slug)}`;
        },
      });
    },
  });

  mountSavedArticles({
    container: dom.left.querySelector("#saved-slot"),
    onOpen: (entry) => {
      window.location.href = `./index.html?slug=${encodeURIComponent(entry.slug)}`;
    },
  });

  renderRecent(dom.left.querySelector("#recent-slot"));
}

async function renderRightRail(article, indexRow) {
  const relatedSlugs = Array.isArray(article.frontMatter.related) ? article.frontMatter.related : [];
  const relatedFromIndex = indexRow && Array.isArray(indexRow.related) ? indexRow.related : [];
  const allRelated = Array.from(new Set([...relatedSlugs, ...relatedFromIndex].filter(Boolean))).slice(0, 8);

  const relatedItems = await getArticlesBySlugs(allRelated);

  dom.right.innerHTML = '<div id="toc-slot"></div><div id="related-slot"></div><div id="feedback-slot"></div>';

  renderToc(dom.right.querySelector("#toc-slot"), article.toc);

  mountRelatedArticles({
    container: dom.right.querySelector("#related-slot"),
    items: relatedItems,
    onOpen: (entry) => {
      window.location.href = `./index.html?slug=${encodeURIComponent(entry.slug || "")}`;
    },
  });
}

function renderToc(container, toc) {
  const items = Array.isArray(toc) ? toc : [];
  container.innerHTML =
    '<div class="kb-panel">' +
    "<h2>On This Page</h2>" +
    '<ul class="kb-toc-list"></ul>' +
    "</div>";

  const list = container.querySelector(".kb-toc-list");
  if (!items.length) {
    list.innerHTML = '<li class="kb-empty-inline">No sections.</li>';
    return;
  }

  list.innerHTML = items
    .map((item) => `<li><a href="#${escapeHtml(item.anchor)}">${escapeHtml(item.title)}</a></li>`)
    .join("");
}

function renderRecent(container) {
  const recent = getRecent();
  container.innerHTML =
    '<div class="kb-panel">' +
    "<h2>Recently Viewed</h2>" +
    '<ul class="kb-saved-list"></ul>' +
    "</div>";

  const list = container.querySelector(".kb-saved-list");
  if (!recent.length) {
    list.innerHTML = '<li class="kb-empty-inline">No recent articles.</li>';
    return;
  }

  list.innerHTML = recent
    .map((entry) => `<li><a href="./index.html?slug=${encodeURIComponent(entry.slug)}">${escapeHtml(entry.title || entry.slug)}</a></li>`)
    .join("");
}

function renderFeedbackSummary(slug) {
  const slot = dom.right?.querySelector("#feedback-slot");
  if (!slot) {
    return;
  }

  const all = readJson(FEEDBACK_KEY, {});
  const row = all[slug] || { up: 0, down: 0 };

  slot.innerHTML =
    '<div class="kb-panel">' +
    "<h2>Helpful Votes</h2>" +
    `<p class="kb-feedback-row">👍 ${row.up || 0} • 👎 ${row.down || 0}</p>` +
    '<p class="kb-muted">Stored locally for this browser.</p>' +
    "</div>";
}

function registerHelpfulVote(slug, vote) {
  const all = readJson(FEEDBACK_KEY, {});
  const row = all[slug] || { up: 0, down: 0 };
  if (vote === "up") {
    row.up += 1;
  } else {
    row.down += 1;
  }
  all[slug] = row;
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all));
}

function writeRecent(slug, title) {
  const recent = getRecent().filter((entry) => entry.slug !== slug);
  recent.unshift({ slug, title });
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 10)));
}

function getRecent() {
  return readJson(RECENT_KEY, []);
}

function renderMissing(message) {
  dom.content.innerHTML = `<section class="kb-empty"><h2>Article unavailable</h2><p>${escapeHtml(message)}</p><p><a href="../kb/index.html">Return to /kb</a></p></section>`;
  dom.left.innerHTML = "";
  dom.right.innerHTML = "";
}

function readJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

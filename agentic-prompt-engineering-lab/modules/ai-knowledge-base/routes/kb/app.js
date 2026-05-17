import { mountSearchBar } from "../../components/SearchBar/index.js";
import { mountCategoryNav } from "../../components/CategoryNav/index.js";
import { mountBreadcrumbs } from "../../components/Breadcrumbs/index.js";
import { mountArticleCard } from "../../components/ArticleCard/index.js";
import {
  getArticleCategories,
  getArticlesByCategory,
  searchAcrossKnowledgeBase,
} from "../../services/kbApi.js";
import { askKnowledgeBase } from "../../services/askKbService.js";

const dom = {
  categoryNav: document.getElementById("category-nav"),
  breadcrumbs: document.getElementById("kb-breadcrumbs"),
  content: document.getElementById("kb-content"),
  askInput: document.getElementById("kb-ask-input"),
  askSubmit: document.getElementById("kb-ask-submit"),
  askOutput: document.getElementById("kb-ask-output"),
  inlineSearch: document.getElementById("search-inline"),
  overlaySearch: document.getElementById("search-overlay"),
  openPalette: document.getElementById("open-palette"),
  closePalette: document.getElementById("close-palette"),
  palette: document.getElementById("kb-palette"),
};

const state = {
  categories: [],
  view: "home",
  category: "",
  query: "",
};

let inlineSearchApi = null;
let overlaySearchApi = null;

void initialize();

async function initialize() {
  state.categories = await getArticleCategories();
  setupSearchBars();
  setupPaletteShortcuts();
  setupAskKb();
  renderFromHash();
  window.addEventListener("hashchange", renderFromHash);
}

function setupSearchBars() {
  inlineSearchApi = mountSearchBar({
    container: dom.inlineSearch,
    label: "Search knowledge base",
    placeholder: "Search articles, glossary, FAQ...",
    onQueryChange: (query) => searchAcrossKnowledgeBase(query, 14),
    onSelect: (result) => openResult(result),
  });

  overlaySearchApi = mountSearchBar({
    container: dom.overlaySearch,
    label: "Command search",
    placeholder: "Type to search all KB content",
    onQueryChange: (query) => searchAcrossKnowledgeBase(query, 20),
    onSelect: (result) => {
      closePalette();
      openResult(result);
    },
  });
}

function setupPaletteShortcuts() {
  dom.openPalette?.addEventListener("click", () => openPalette());
  dom.closePalette?.addEventListener("click", () => closePalette());

  dom.palette?.addEventListener("click", (event) => {
    if (event.target === dom.palette) {
      closePalette();
    }
  });

  window.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openPalette();
      return;
    }

    if (event.key === "Escape" && dom.palette?.classList.contains("is-open")) {
      closePalette();
    }
  });
}

function openPalette() {
  dom.palette?.classList.add("is-open");
  dom.palette?.setAttribute("aria-hidden", "false");
  overlaySearchApi?.focus();
}

function closePalette() {
  dom.palette?.classList.remove("is-open");
  dom.palette?.setAttribute("aria-hidden", "true");
}

function renderFromHash() {
  const hash = (window.location.hash || "").replace(/^#/, "");
  const params = new URLSearchParams(hash);
  const view = params.get("view") || "home";

  state.view = view;
  state.category = params.get("category") || "";
  state.query = params.get("q") || "";

  renderLayout();
  void renderContent();
}

function renderLayout() {
  mountCategoryNav({
    container: dom.categoryNav,
    categories: state.categories,
    activeCategory: state.category,
    onSelect: (category) => {
      window.location.hash = buildHash({ view: "category", category });
    },
  });

  const crumbItems = [
    {
      label: "Knowledge Base",
      onClick: () => {
        window.location.hash = buildHash({ view: "home" });
      },
    },
  ];

  if (state.view === "category" && state.category) {
    crumbItems.push({
      label: prettyCategory(state.category),
    });
  }

  if (state.view === "search") {
    crumbItems.push({
      label: `Search: ${state.query || ""}`,
    });
  }

  mountBreadcrumbs({
    container: dom.breadcrumbs,
    items: crumbItems,
  });
}

async function renderContent() {
  if (state.view === "category" && state.category) {
    const articles = await getArticlesByCategory(state.category);
    dom.content.innerHTML = `<h2 class="kb-section-title">${prettyCategory(state.category)}</h2>`;
    const holder = document.createElement("div");
    dom.content.appendChild(holder);
    mountArticleCard({
      container: holder,
      items: articles,
      emptyLabel: "No articles found in this category yet.",
      onOpen: openResult,
    });
    return;
  }

  if (state.view === "search") {
    const results = await searchAcrossKnowledgeBase(state.query, 30);
    dom.content.innerHTML = `<h2 class="kb-section-title">Search results for "${escapeHtml(state.query)}"</h2>`;
    const holder = document.createElement("div");
    dom.content.appendChild(holder);
    mountArticleCard({
      container: holder,
      items: results,
      emptyLabel: "No matches found across articles, glossary, or FAQ.",
      onOpen: openResult,
    });
    return;
  }

  dom.content.innerHTML =
    '<h2 class="kb-section-title">Browse by Topic</h2>' +
    "<p class=\"kb-lead\">Pick a topic from the left tree or run a global search with Ctrl/Cmd+K.</p>";

  const cards = [];
  for (const category of state.categories) {
    const list = await getArticlesByCategory(category.key);
    if (list[0]) {
      cards.push(list[0]);
    }
  }

  const holder = document.createElement("div");
  dom.content.appendChild(holder);
  mountArticleCard({
    container: holder,
    items: cards,
    emptyLabel: "No article previews available.",
    onOpen: openResult,
  });
}

function openResult(result) {
  const query = inlineQuery();
  if (query) {
    window.location.hash = buildHash({ view: "search", q: query });
  }

  if (result.type === "article") {
    window.location.href = `../article/index.html?slug=${encodeURIComponent(result.slug || "")}`;
    return;
  }

  if (result.type === "glossary") {
    window.location.href = `../glossary/index.html?term=${encodeURIComponent(result.term || result.title || "")}`;
    return;
  }

  if (result.type === "faq") {
    window.location.href = `../faq/index.html?question=${encodeURIComponent(result.title || "")}`;
  }
}

function inlineQuery() {
  const input = dom.inlineSearch?.querySelector(".kb-search-input");
  return input ? input.value.trim() : "";
}

function buildHash(nextState) {
  const params = new URLSearchParams();
  params.set("view", nextState.view || "home");
  if (nextState.category) {
    params.set("category", nextState.category);
  }
  if (nextState.q) {
    params.set("q", nextState.q);
  }
  return params.toString();
}

function prettyCategory(key) {
  return String(key)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
 
function setupAskKb() {
  if (!dom.askInput || !dom.askSubmit || !dom.askOutput) {
    return;
  }

  dom.askSubmit.addEventListener("click", runAskKb);
  dom.askInput.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      runAskKb();
    }
  });
}

async function runAskKb() {
  if (!dom.askInput || !dom.askSubmit || !dom.askOutput) {
    return;
  }

  const question = dom.askInput.value.trim();
  if (!question) {
    dom.askOutput.innerHTML = '<p class="kb-muted">Enter a question first.</p>';
    return;
  }

  dom.askSubmit.disabled = true;
  dom.askOutput.innerHTML = '<p class="kb-muted">Searching and preparing answer...</p>';

  try {
    const response = await askKnowledgeBase(question);
    const referenceHtml = response.contexts
      .map((ctx) => {
        return `<li><a href="../article/index.html?slug=${encodeURIComponent(ctx.slug)}">${escapeHtml(
          ctx.title
        )}</a></li>`;
      })
      .join("");

    dom.askOutput.innerHTML = [
      formatAskAnswer(response.answer),
      referenceHtml ? `<h3>References</h3><ul>${referenceHtml}</ul>` : "",
    ].join("");
  } catch (error) {
    dom.askOutput.innerHTML =
      '<p class="kb-muted">Ask the KB is unavailable right now. Try again shortly.</p>';
    console.error("Ask KB failed:", error);
  } finally {
    dom.askSubmit.disabled = false;
  }
}

function formatAskAnswer(rawAnswer) {
  const parsed = tryParseJsonObject(rawAnswer);
  if (!parsed) {
    return `<p>${escapeHtml(rawAnswer)}</p>`;
  }

  const lines = [];
  if (parsed.summary) {
    lines.push(`<p>${escapeHtml(String(parsed.summary))}</p>`);
  } else {
    lines.push(`<p>${escapeHtml(String(rawAnswer))}</p>`);
  }

  const details = [];
  if (parsed.status) {
    details.push(`<li><strong>Status:</strong> ${escapeHtml(String(parsed.status))}</li>`);
  }
  if (parsed.model) {
    details.push(`<li><strong>Model:</strong> ${escapeHtml(String(parsed.model))}</li>`);
  }

  if (details.length) {
    lines.push(`<ul>${details.join("")}</ul>`);
  }

  return lines.join("");
}

function tryParseJsonObject(value) {
  const text = String(value || "").trim();
  if (!text.startsWith("{") || !text.endsWith("}")) {
    return null;
  }

  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

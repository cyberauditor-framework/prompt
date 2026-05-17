import { searchKnowledgeBase } from "./searchService.js";

let indexCache = null;

export async function getKnowledgeBaseIndex() {
  if (indexCache) {
    return indexCache;
  }

  const url = new URL("../data/index.json", import.meta.url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to load AI Knowledge Base index.");
  }

  const payload = await response.json();
  indexCache = Array.isArray(payload.entries) ? payload.entries : [];
  return indexCache;
}

export async function getArticleCategories() {
  const entries = await getKnowledgeBaseIndex();
  const keys = new Set();

  entries.forEach((entry) => {
    if (entry.type === "article" && entry.category) {
      keys.add(entry.category);
    }
  });

  return Array.from(keys).sort().map((key) => ({
    key,
    label: categoryLabel(key),
  }));
}

export async function getArticlesByCategory(category) {
  const entries = await getKnowledgeBaseIndex();
  return entries.filter((entry) => entry.type === "article" && entry.category === category);
}

export async function getArticleIndexBySlug(slug) {
  const entries = await getKnowledgeBaseIndex();
  return entries.find((entry) => entry.type === "article" && entry.slug === slug) || null;
}

export async function getArticlesBySlugs(slugs) {
  const wanted = new Set(Array.isArray(slugs) ? slugs : []);
  if (!wanted.size) {
    return [];
  }

  const entries = await getKnowledgeBaseIndex();
  return entries.filter((entry) => entry.type === "article" && wanted.has(entry.slug));
}

export async function searchAcrossKnowledgeBase(query, limit = 20) {
  const entries = await getKnowledgeBaseIndex();
  return searchKnowledgeBase(entries, query, { limit });
}

export async function getTopArticleHits(query, limit = 3) {
  const results = await searchAcrossKnowledgeBase(query, 40);
  return results.filter((entry) => entry.type === "article").slice(0, limit);
}

function categoryLabel(categoryKey) {
  return String(categoryKey || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

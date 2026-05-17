import { getTopArticleHits } from "./kbApi.js";
import { loadArticleBySlug } from "./articleService.js";

export async function askKnowledgeBase(question) {
  const query = String(question || "").trim();
  if (!query) {
    return {
      answer: "Please enter a question before running Ask the KB.",
      contexts: [],
    };
  }

  const topHits = await getTopArticleHits(query, 3);
  const contexts = [];

  for (const hit of topHits) {
    try {
      const article = await loadArticleBySlug(hit.slug);
      contexts.push({
        slug: hit.slug,
        title: article.frontMatter?.title || hit.title || hit.slug,
        excerpt: String(article.body || "").slice(0, 1300),
      });
    } catch {
      contexts.push({
        slug: hit.slug,
        title: hit.title || hit.slug,
        excerpt: String(hit.text || "").slice(0, 500),
      });
    }
  }

  const prompt = buildGroundedPrompt(query, contexts);
  const response = await fetch("/api/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inputText: prompt,
      model: "kb-rag-existing-execute",
      halted: false,
    }),
  });

  if (!response.ok) {
    throw new Error("Ask the KB request failed.");
  }

  const payload = await response.json();
  const answer = String(payload.outputText || "No answer returned by executor.");

  return {
    answer,
    contexts,
    trace: Array.isArray(payload.trace) ? payload.trace : [],
  };
}

function buildGroundedPrompt(question, contexts) {
  const contextText = contexts.length
    ? contexts
        .map((ctx, idx) => {
          return [
            `Context ${idx + 1}: ${ctx.title} (${ctx.slug})`,
            ctx.excerpt,
          ].join("\n");
        })
        .join("\n\n")
    : "No relevant KB contexts were found.";

  return [
    "Answer the user question using only the supplied KB contexts.",
    "If context is insufficient, explicitly say so.",
    "",
    `Question: ${question}`,
    "",
    "KB Contexts:",
    contextText,
  ].join("\n");
}

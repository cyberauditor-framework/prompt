import test from "node:test";
import assert from "node:assert/strict";
import {
  searchKnowledgeBase,
  highlightText,
  buildSnippet,
} from "../services/searchService.js";

test("searchKnowledgeBase prioritizes title matches", () => {
  const docs = [
    {
      type: "article",
      slug: "gradient-descent-basics",
      title: "Gradient Descent Basics",
      text: "Optimization by iterative updates.",
      tags: ["optimization"],
    },
    {
      type: "article",
      slug: "training-overview",
      title: "Model Training Overview",
      text: "Gradient descent appears once here.",
      tags: ["training"],
    },
  ];

  const results = searchKnowledgeBase(docs, "gradient descent", { limit: 2 });
  assert.equal(results.length, 2);
  assert.equal(results[0].slug, "gradient-descent-basics");
});

test("highlightText escapes html before marking matches", () => {
  const input = 'Use <script>alert(1)</script> and vector';
  const output = highlightText(input, "vector");

  assert.match(output, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(output, /<mark>vector<\/mark>/i);
});

test("buildSnippet includes marked context around query", () => {
  const input = "A long paragraph introducing neural networks and optimization behavior.";
  const output = buildSnippet(input, ["optimization"]);

  assert.match(output, /optimization/i);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderArticleViewerHtml } from "../components/ArticleViewer/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const snapshotPath = path.join(__dirname, "snapshots", "articleViewer.html");

test("renderArticleViewerHtml matches snapshot", () => {
  const html = renderArticleViewerHtml({
    slug: "test-article",
    frontMatter: {
      title: "Test Article",
      category: "foundations",
      difficulty: "beginner",
      reading_time_min: 7,
      tags: ["agent", "prompting"],
    },
    html: "<h2 id=\"overview\">Overview</h2><p>Example body.</p>",
  });

  const expected = fs.readFileSync(snapshotPath, "utf8").trim();
  assert.equal(html.trim(), expected);
});

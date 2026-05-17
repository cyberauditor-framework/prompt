# AI Knowledge Base Module

This module provides a static knowledge base experience for the Agentic Prompt Engineering Lab.

## What is inside

- `routes/kb/`: three-pane KB home route with search, category browsing, and Ask the KB panel.
- `routes/article/`: article reading route with TOC, related links, saved state, and helpful voting.
- `services/kbApi.js`: index/category/query helpers.
- `services/searchService.js`: local scoring, snippets, and highlighting.
- `services/articleService.js`: markdown/front-matter parser and HTML renderer.
- `services/askKbService.js`: retrieval-grounded Ask the KB orchestration through existing `/api/execute`.
- `components/`: reusable UI blocks (search bar, cards, breadcrumbs, article viewer, related/saved).
- `data/`: static KB corpus (index, glossary, faq, and article markdown files).
- `tests/`: node:test unit and snapshot checks.

## Add a new article

1. Create a markdown file in `data/articles/` using slug naming.
2. Include front matter keys used by the reader:
   - `title`
   - `category`
   - `difficulty`
   - `reading_time_min`
   - `tags` (array)
3. Update `data/index.json` with a searchable entry that points to the same slug.
4. Ensure the category exists in the category list source used by `kbApi.js`.
5. Run module tests and the project build:
   - `node --test ./agentic-prompt-engineering-lab/modules/ai-knowledge-base/tests/*.test.mjs`
   - `npm run build`

## Remove an article

1. Remove the markdown file from `data/articles/`.
2. Remove matching entries from `data/index.json` and any related glossary/faq cross-links.
3. Verify no links still reference the slug.
4. Run tests and build.

## Accessibility notes

- Keyboard shortcuts remain available (`Ctrl/Cmd+K` for command search).
- Skip links are provided in KB and article routes.
- Ask KB status updates use an `aria-live` region.
- Focus indicators are enforced with `:focus-visible` styling.

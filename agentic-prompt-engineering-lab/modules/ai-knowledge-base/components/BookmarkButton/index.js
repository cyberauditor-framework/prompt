const BOOKMARK_KEY = "kb-bookmarks";

export function mountBookmarkButton(options) {
  const { container, slug, title, onChange } = options;
  const saved = getBookmarks();
  const isSaved = saved.some((entry) => entry.slug === slug);

  container.innerHTML = `<button type="button" class="kb-bookmark-btn">${isSaved ? "Remove bookmark" : "Save article"}</button>`;
  const button = container.querySelector(".kb-bookmark-btn");
  button?.addEventListener("click", () => {
    const next = toggleBookmark(slug, title);
    const nowSaved = next.some((entry) => entry.slug === slug);
    button.textContent = nowSaved ? "Remove bookmark" : "Save article";
    if (typeof onChange === "function") {
      onChange(next);
    }
  });
}

export function getBookmarks() {
  return parseEntries(localStorage.getItem(BOOKMARK_KEY));
}

export function toggleBookmark(slug, title) {
  const current = getBookmarks();
  const exists = current.find((entry) => entry.slug === slug);
  let next;

  if (exists) {
    next = current.filter((entry) => entry.slug !== slug);
  } else {
    next = [{ slug, title }, ...current].slice(0, 50);
  }

  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
  return next;
}

export function mountSavedArticles(options) {
  const { container, onOpen } = options;
  const bookmarks = getBookmarks();

  container.innerHTML =
    '<div class="kb-panel">' +
    "<h2>My Saved Articles</h2>" +
    '<ul class="kb-saved-list"></ul>' +
    "</div>";

  const list = container.querySelector(".kb-saved-list");
  if (!bookmarks.length) {
    list.innerHTML = '<li class="kb-empty-inline">No bookmarks yet.</li>';
    return;
  }

  list.innerHTML = bookmarks
    .map((entry, idx) => `<li><button type="button" class="kb-saved-btn" data-idx="${idx}">${escapeHtml(entry.title || entry.slug)}</button></li>`)
    .join("");

  list.querySelectorAll(".kb-saved-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const idx = Number(button.getAttribute("data-idx"));
      if (Number.isInteger(idx) && bookmarks[idx]) {
        onOpen(bookmarks[idx]);
      }
    });
  });
}

function parseEntries(raw) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && entry.slug) : [];
  } catch {
    return [];
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

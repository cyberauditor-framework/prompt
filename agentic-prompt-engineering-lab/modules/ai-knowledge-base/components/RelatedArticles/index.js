export function mountRelatedArticles(options) {
  const { container, items, onOpen } = options;

  container.innerHTML =
    '<div class="kb-panel">' +
    "<h2>Related Articles</h2>" +
    '<ul class="kb-related-list"></ul>' +
    "</div>";

  const list = container.querySelector(".kb-related-list");

  if (!items || !items.length) {
    list.innerHTML = '<li class="kb-empty-inline">No related links available.</li>';
    return;
  }

  list.innerHTML = items
    .map((item, idx) => `<li><button type="button" class="kb-related-btn" data-idx="${idx}">${escapeHtml(item.title || item.slug)}</button></li>`)
    .join("");

  list.querySelectorAll(".kb-related-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const idx = Number(button.getAttribute("data-idx"));
      if (Number.isInteger(idx) && items[idx]) {
        onOpen(items[idx]);
      }
    });
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

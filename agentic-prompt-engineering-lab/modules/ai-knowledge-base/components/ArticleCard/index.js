export function mountArticleCard(options) {
  const { container, items, emptyLabel, onOpen } = options;

  if (!items || !items.length) {
    container.innerHTML = `<div class="kb-empty">${emptyLabel || "No entries available."}</div>`;
    return;
  }

  container.innerHTML =
    '<div class="kb-card-grid">' +
    items
      .map((item, idx) => {
        const kind = item.type || "article";
        const meta = item.category || item.term || kind;
        const text = item.snippet || item.text || "";
        return (
          `<article class="kb-card" data-idx="${idx}">` +
          `<span class="kb-chip kb-chip-${kind}">${kind}</span>` +
          `<h3>${item.title || item.term || "Untitled"}</h3>` +
          `<p class="kb-card-meta">${meta}</p>` +
          `<p class="kb-card-text">${text}</p>` +
          '<button class="kb-open-btn" type="button">Open</button>' +
          "</article>"
        );
      })
      .join("") +
    "</div>";

  container.querySelectorAll(".kb-card").forEach((card) => {
    card.querySelector(".kb-open-btn")?.addEventListener("click", () => {
      const idx = Number(card.getAttribute("data-idx"));
      if (Number.isInteger(idx) && items[idx]) {
        onOpen(items[idx]);
      }
    });
  });
}

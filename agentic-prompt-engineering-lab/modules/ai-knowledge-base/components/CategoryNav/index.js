export function mountCategoryNav(options) {
  const { container, categories, activeCategory, onSelect } = options;

  container.innerHTML =
    '<div class="kb-panel">' +
    "<h2>Topic Tree</h2>" +
    '<ul class="kb-category-list"></ul>' +
    "</div>";

  const list = container.querySelector(".kb-category-list");
  list.innerHTML = categories
    .map((category) => {
      const isActive = category.key === activeCategory;
      return (
        `<li><button class="kb-category-btn ${isActive ? "is-active" : ""}" data-key="${category.key}">` +
        `${category.label}</button></li>`
      );
    })
    .join("");

  list.querySelectorAll(".kb-category-btn").forEach((button) => {
    button.addEventListener("click", () => {
      onSelect(button.getAttribute("data-key") || "");
    });
  });
}

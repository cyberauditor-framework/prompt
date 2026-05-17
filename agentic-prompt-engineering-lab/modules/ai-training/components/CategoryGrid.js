export function mountCategoryGrid(options) {
  const { container, categories, completedLessons, onOpenCategory } = options;
  if (!container) {
    return;
  }

  container.innerHTML = "";
  const grid = document.createElement("section");
  grid.className = "ai-training-main";
  grid.setAttribute("aria-label", "AI training categories");

  categories.forEach((category) => {
    const total = category.lessons.length;
    const done = category.lessons.filter((lesson) => completedLessons.has(lesson.id)).length;

    const card = document.createElement("button");
    card.type = "button";
    card.className = "category-card";
    card.innerHTML =
      "<h2>" +
      category.title +
      "</h2>" +
      "<p>" +
      category.description +
      "</p>" +
      '<div class="category-meta"><span>' +
      String(done) +
      "/" +
      String(total) +
      ' complete</span><span>Open lessons</span></div>';

    card.addEventListener("click", () => onOpenCategory(category.id));
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

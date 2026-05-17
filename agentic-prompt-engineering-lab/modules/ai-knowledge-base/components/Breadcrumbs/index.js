export function mountBreadcrumbs(options) {
  const { container, items } = options;

  container.innerHTML =
    '<nav class="kb-breadcrumbs" aria-label="Breadcrumbs">' +
    items
      .map((item, index) => {
        const tail = index === items.length - 1;
        if (tail) {
          return `<span class="kb-crumb is-current">${item.label}</span>`;
        }
        return `<button class="kb-crumb" data-index="${index}">${item.label}</button><span class="kb-crumb-sep">/</span>`;
      })
      .join("") +
    "</nav>";

  container.querySelectorAll(".kb-crumb[data-index]").forEach((node) => {
    node.addEventListener("click", () => {
      const idx = Number(node.getAttribute("data-index"));
      if (Number.isInteger(idx) && items[idx] && typeof items[idx].onClick === "function") {
        items[idx].onClick();
      }
    });
  });
}

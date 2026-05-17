import { highlightText } from "../../services/searchService.js";

export function mountSearchBar(options) {
  const {
    container,
    label,
    placeholder,
    onQueryChange,
    onSelect,
  } = options;

  container.innerHTML =
    '<div class="kb-search">' +
    `<label class="kb-search-label">${label}</label>` +
    `<input class="kb-search-input" type="search" placeholder="${placeholder}" aria-label="${label}" />` +
    '<ul class="kb-search-results" role="listbox"></ul>' +
    "</div>";

  const input = container.querySelector(".kb-search-input");
  const list = container.querySelector(".kb-search-results");
  let timer = null;
  let activeIndex = -1;
  let currentResults = [];

  function updateResults(results, query) {
    currentResults = results || [];
    activeIndex = -1;
    if (!currentResults.length) {
      list.innerHTML = query ? '<li class="kb-search-empty">No results found.</li>' : "";
      return;
    }

    list.innerHTML = currentResults
      .map((result, idx) => {
        const title = highlightText(result.title || result.term || "Untitled", query);
        const snippet = highlightText(result.snippet || result.text || "", query);
        const type = String(result.type || "result");
        return (
          `<li class="kb-search-item" role="option" data-idx="${idx}" aria-selected="false">` +
          `<span class="kb-chip kb-chip-${type}">${type}</span>` +
          `<p class="kb-search-title">${title}</p>` +
          `<p class="kb-search-snippet">${snippet}</p>` +
          "</li>"
        );
      })
      .join("");

    list.querySelectorAll(".kb-search-item").forEach((node) => {
      node.addEventListener("click", () => {
        const idx = Number(node.getAttribute("data-idx"));
        if (Number.isInteger(idx) && currentResults[idx]) {
          onSelect(currentResults[idx]);
        }
      });
    });
  }

  function setActive(index) {
    const nodes = list.querySelectorAll(".kb-search-item");
    nodes.forEach((node) => node.setAttribute("aria-selected", "false"));

    if (!nodes.length || index < 0 || index >= nodes.length) {
      activeIndex = -1;
      return;
    }

    activeIndex = index;
    nodes[activeIndex].setAttribute("aria-selected", "true");
    nodes[activeIndex].scrollIntoView({ block: "nearest" });
  }

  input.addEventListener("input", () => {
    if (timer) {
      clearTimeout(timer);
    }

    const query = input.value;
    timer = window.setTimeout(async () => {
      const results = await onQueryChange(query);
      updateResults(results, query);
    }, 250);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(Math.min(currentResults.length - 1, activeIndex + 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(Math.max(0, activeIndex - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && currentResults[activeIndex]) {
      event.preventDefault();
      onSelect(currentResults[activeIndex]);
    }
  });

  return {
    focus() {
      input.focus();
    },
    setQuery(value) {
      input.value = value || "";
      input.dispatchEvent(new Event("input"));
    },
    clear() {
      input.value = "";
      list.innerHTML = "";
      currentResults = [];
      activeIndex = -1;
    },
  };
}

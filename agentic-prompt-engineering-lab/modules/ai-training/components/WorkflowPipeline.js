export function mountWorkflowPipeline(options) {
  const { container, lessons, activeLessonId, onSelectLesson } = options;
  if (!container) {
    return;
  }

  container.innerHTML = "";
  const wrap = document.createElement("section");
  wrap.className = "workflow-pipeline";
  wrap.setAttribute("aria-label", "AI model development workflow pipeline");

  const title = document.createElement("h3");
  title.textContent = "Interactive 6-step pipeline";
  wrap.appendChild(title);

  const line = document.createElement("div");
  line.className = "workflow-line";
  wrap.appendChild(line);

  const grid = document.createElement("div");
  grid.className = "workflow-grid";

  lessons.forEach((lesson, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "workflow-step" + (lesson.id === activeLessonId ? " is-active" : "");
    button.setAttribute("aria-current", lesson.id === activeLessonId ? "step" : "false");
    button.innerHTML =
      '<span class="workflow-index">' +
      String(index + 1) +
      "</span>" +
      '<span class="workflow-label">' +
      lesson.title.replace(/^\d+\.\s*/, "") +
      "</span>";
    button.addEventListener("click", () => onSelectLesson(lesson.id));
    grid.appendChild(button);
  });

  wrap.appendChild(grid);
  container.appendChild(wrap);
}

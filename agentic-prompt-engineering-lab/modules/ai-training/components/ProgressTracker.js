export function mountProgressTracker(options) {
  const { container, totalLessons, completedCount, currentLabel, onReset } = options;
  if (!container) {
    return;
  }

  const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  container.innerHTML =
    '<section class="progress-panel" aria-label="Learning progress">' +
    '<div class="progress-head">' +
    "<h2>Progress tracker</h2>" +
    '<button class="reset-btn" type="button">Reset</button>' +
    "</div>" +
    '<p class="progress-label">' +
    completedCount +
    "/" +
    totalLessons +
    " lessons completed" +
    "</p>" +
    '<div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
    percent +
    '"><span style="width:' +
    percent +
    '%"></span></div>' +
    '<p class="progress-current">Current focus: ' +
    (currentLabel || "Category overview") +
    "</p>" +
    "</section>";

  const reset = container.querySelector(".reset-btn");
  if (reset) {
    reset.addEventListener("click", onReset);
  }
}

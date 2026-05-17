export function mountLessonViewer(options) {
  const {
    container,
    categoryTitle,
    lessonTitle,
    lessonHtml,
    isCompleted,
    previousLabel,
    nextLabel,
    onBack,
    onToggleCompleted,
    onPrevious,
    onNext,
  } = options;

  if (!container) {
    return;
  }

  container.innerHTML =
    '<section class="lesson-view" aria-label="Lesson detail">' +
    '<div class="lesson-head">' +
    '<button type="button" class="ghost-btn lesson-back">Back to lessons</button>' +
    '<p class="lesson-kicker">' +
    categoryTitle +
    "</p>" +
    "<h2>" +
    lessonTitle +
    "</h2>" +
    "</div>" +
    '<article class="lesson-content">' +
    lessonHtml +
    "</article>" +
    '<div class="lesson-actions">' +
    '<button type="button" class="solid-btn lesson-complete">' +
    (isCompleted ? "Mark as not completed" : "Mark lesson complete") +
    "</button>" +
    '<div class="lesson-flow">' +
    '<button type="button" class="ghost-btn lesson-prev" ' +
    (onPrevious ? "" : "disabled") +
    ">" +
    (previousLabel || "Previous") +
    "</button>" +
    '<button type="button" class="ghost-btn lesson-next" ' +
    (onNext ? "" : "disabled") +
    ">" +
    (nextLabel || "Next") +
    "</button>" +
    "</div>" +
    "</div>" +
    "</section>";

  const backBtn = container.querySelector(".lesson-back");
  const completeBtn = container.querySelector(".lesson-complete");
  const prevBtn = container.querySelector(".lesson-prev");
  const nextBtn = container.querySelector(".lesson-next");

  if (backBtn) {
    backBtn.addEventListener("click", onBack);
  }
  if (completeBtn) {
    completeBtn.addEventListener("click", onToggleCompleted);
  }
  if (prevBtn && onPrevious) {
    prevBtn.addEventListener("click", onPrevious);
  }
  if (nextBtn && onNext) {
    nextBtn.addEventListener("click", onNext);
  }
}

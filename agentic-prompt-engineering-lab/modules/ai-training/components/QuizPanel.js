function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function mountQuizPanel(options) {
  const { container, quizzes } = options;
  if (!container) {
    return;
  }

  if (!Array.isArray(quizzes) || quizzes.length === 0) {
    container.innerHTML = "";
    return;
  }

  const cards = quizzes
    .map((quiz, idx) => {
      const optionsHtml = quiz.options
        .map(
          (opt) =>
            '<button type="button" class="quiz-option" data-q="' +
            idx +
            '" data-choice="' +
            escapeHtml(opt.key) +
            '"><span class="quiz-key">' +
            escapeHtml(opt.key) +
            ")</span><span>" +
            escapeHtml(opt.text) +
            "</span></button>"
        )
        .join("");

      return (
        '<article class="quiz-card" data-quiz="' +
        idx +
        '"><h4>Question ' +
        (idx + 1) +
        '</h4><p class="quiz-question">' +
        escapeHtml(quiz.question) +
        '</p><div class="quiz-options">' +
        optionsHtml +
        '</div><p class="quiz-feedback" aria-live="polite"></p></article>'
      );
    })
    .join("");

  container.innerHTML = '<section class="quiz-panel" aria-label="Self-check quiz"><h3>Self-check quiz</h3>' + cards + "</section>";

  container.querySelectorAll(".quiz-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const quizIndex = Number(btn.getAttribute("data-q"));
      const choice = btn.getAttribute("data-choice") || "";
      const quiz = quizzes[quizIndex];
      if (!quiz) {
        return;
      }

      const card = container.querySelector('[data-quiz="' + quizIndex + '"]');
      if (!card) {
        return;
      }

      card.querySelectorAll(".quiz-option").forEach((node) => {
        node.classList.remove("is-correct", "is-wrong");
      });

      const isCorrect = choice.toUpperCase() === quiz.answer.toUpperCase();
      btn.classList.add(isCorrect ? "is-correct" : "is-wrong");

      const feedback = card.querySelector(".quiz-feedback");
      if (feedback) {
        feedback.innerHTML =
          (isCorrect ? "Correct. " : "Not quite. ") +
          "Answer: <strong>" +
          escapeHtml(quiz.answer) +
          "</strong>. " +
          escapeHtml(quiz.explanation || "");
      }
    });
  });
}

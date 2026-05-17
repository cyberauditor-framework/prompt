import { registerModule } from "../index.js";
import { lessonCatalog, lessonById, allLessons } from "../content/lessonCatalog.js";
import { mountCategoryGrid } from "../components/CategoryGrid.js";
import { mountLessonViewer } from "../components/LessonViewer.js";
import { mountQuizPanel } from "../components/QuizPanel.js";
import { mountProgressTracker } from "../components/ProgressTracker.js";
import { mountCodeViewer } from "../components/CodeViewer.js";
import { mountWorkflowPipeline } from "../components/WorkflowPipeline.js";

registerModule();

const STORAGE_KEY = "ai-training-center-progress-v1";

const dom = {
  subtitle: document.getElementById("subtitle"),
  progress: document.getElementById("progress-root"),
  announcer: document.getElementById("ai-training-announcer"),
  view: document.getElementById("view-root"),
};

const state = {
  completed: new Set(),
  currentCategoryId: null,
  currentLessonId: null,
  lessonCache: new Map(),
  renderToken: 0,
};

loadProgress();
window.addEventListener("hashchange", renderFromHash);
renderFromHash();

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.completed)) {
      parsed.completed.forEach((id) => state.completed.add(id));
    }
  } catch {
    state.completed = new Set();
  }
}

function saveProgress() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      completed: Array.from(state.completed),
      updatedAt: Date.now(),
    })
  );
}

function renderFromHash() {
  const hash = (window.location.hash || "").replace(/^#/, "");
  const [kind, id] = hash.split("/");

  if (kind === "lesson" && id && lessonById[id]) {
    state.currentLessonId = id;
    state.currentCategoryId = lessonById[id].categoryId;
    renderLesson(id);
    return;
  }

  if (kind === "category" && id) {
    const category = lessonCatalog.find((entry) => entry.id === id);
    if (category) {
      state.currentCategoryId = id;
      state.currentLessonId = null;
      renderCategory(category);
      return;
    }
  }

  state.currentCategoryId = null;
  state.currentLessonId = null;
  state.renderToken += 1;
  renderLanding();
}

function announce(message) {
  if (!dom.announcer) {
    return;
  }
  dom.announcer.textContent = "";
  window.setTimeout(() => {
    dom.announcer.textContent = message;
  }, 20);
}

function renderProgress(currentLabel) {
  mountProgressTracker({
    container: dom.progress,
    totalLessons: allLessons.length,
    completedCount: state.completed.size,
    currentLabel,
    onReset: () => {
      const yes = window.confirm("Reset all lesson completion progress?");
      if (!yes) {
        return;
      }
      state.completed.clear();
      saveProgress();
      announce("Progress reset.");
      renderFromHash();
    },
  });
}

function renderLanding() {
  dom.subtitle.textContent =
    "Choose a learning category, open lessons, and track completion as you progress.";
  renderProgress("Category overview");

  mountCategoryGrid({
    container: dom.view,
    categories: lessonCatalog,
    completedLessons: state.completed,
    onOpenCategory: (categoryId) => {
      window.location.hash = "category/" + categoryId;
    },
  });
}

function renderCategory(category) {
  dom.subtitle.textContent = category.description;
  renderProgress(category.title);

  const workflowShell =
    category.id === "workflow"
      ? '<div id="workflow-root" class="workflow-root"></div>'
      : "";

  dom.view.innerHTML =
    '<section class="lessons-panel" aria-label="Category lessons">' +
    '<div class="lessons-head">' +
    '<button class="ghost-btn" type="button" id="back-to-categories">All categories</button>' +
    "<h2>" +
    category.title +
    "</h2>" +
    "</div>" +
    '<div class="lesson-list" id="lesson-list"></div>' +
    workflowShell +
    "</section>";

  const back = document.getElementById("back-to-categories");
  if (back) {
    back.addEventListener("click", () => {
      window.location.hash = "";
    });
  }

  const list = document.getElementById("lesson-list");
  if (list) {
    list.innerHTML = category.lessons
      .map((lesson) => {
        const done = state.completed.has(lesson.id);
        return (
          '<button type="button" class="lesson-item ' +
          (done ? "is-complete" : "") +
          '" data-id="' +
          lesson.id +
          '" aria-label="' +
          lesson.title +
          (done ? ', completed' : ', open') +
          '"><span class="lesson-item-title">' +
          lesson.title +
          '</span><span class="lesson-item-state">' +
          (done ? "Completed" : "Open") +
          "</span></button>"
        );
      })
      .join("");

    list.querySelectorAll(".lesson-item").forEach((node) => {
      node.addEventListener("click", () => {
        const lessonId = node.getAttribute("data-id");
        if (lessonId) {
          window.location.hash = "lesson/" + lessonId;
        }
      });
    });
  }

  if (category.id === "workflow") {
    const workflowRoot = document.getElementById("workflow-root");
    mountWorkflowPipeline({
      container: workflowRoot,
      lessons: category.lessons,
      activeLessonId: null,
      onSelectLesson: (lessonId) => {
        window.location.hash = "lesson/" + lessonId;
      },
    });
  }
}

async function renderLesson(lessonId) {
  const lesson = lessonById[lessonId];
  if (!lesson) {
    window.location.hash = "";
    return;
  }

  const renderToken = ++state.renderToken;
  dom.view.innerHTML = '<section class="lesson-view loading-view" aria-label="Loading lesson"><p>Loading lesson...</p></section>';

  renderProgress(lesson.title);
  dom.subtitle.textContent = lesson.categoryTitle + " / " + lesson.title;

  const lessonData = await loadLesson(lesson.file);
  if (renderToken !== state.renderToken) {
    return;
  }

  const category = lessonCatalog.find((entry) => entry.id === lesson.categoryId);
  const lessonIndex = category ? category.lessons.findIndex((entry) => entry.id === lesson.id) : -1;
  const previousLesson = category && lessonIndex > 0 ? category.lessons[lessonIndex - 1] : null;
  const nextLesson = category && lessonIndex >= 0 && lessonIndex < category.lessons.length - 1 ? category.lessons[lessonIndex + 1] : null;

  mountLessonViewer({
    container: dom.view,
    categoryTitle: lesson.categoryTitle,
    lessonTitle: lessonData.title || lesson.title,
    lessonHtml: lessonData.html,
    isCompleted: state.completed.has(lessonId),
    previousLabel: previousLesson ? "Previous: " + previousLesson.title : "Previous lesson",
    nextLabel: nextLesson ? "Next: " + nextLesson.title : "Next lesson",
    onBack: () => {
      window.location.hash = "category/" + lesson.categoryId;
    },
    onToggleCompleted: () => {
      if (state.completed.has(lessonId)) {
        state.completed.delete(lessonId);
        announce("Lesson marked as not completed.");
      } else {
        state.completed.add(lessonId);
        announce("Lesson marked complete.");
      }
      saveProgress();
      renderLesson(lessonId);
    },
    onPrevious: previousLesson
      ? () => {
          window.location.hash = "lesson/" + previousLesson.id;
        }
      : null,
    onNext: nextLesson
      ? () => {
          window.location.hash = "lesson/" + nextLesson.id;
        }
      : null,
  });

  const quizHost = document.createElement("div");
  quizHost.id = "quiz-root";
  const lessonContent = dom.view.querySelector(".lesson-content");
  if (lessonContent) {
    lessonContent.appendChild(quizHost);
  }

  mountQuizPanel({
    container: quizHost,
    quizzes: lessonData.quizzes,
  });

  if (lesson.categoryId === "workflow") {
    const pipelineHost = document.createElement("div");
    pipelineHost.className = "workflow-inline";
    dom.view.appendChild(pipelineHost);
    if (category) {
      mountWorkflowPipeline({
        container: pipelineHost,
        lessons: category.lessons,
        activeLessonId: lesson.id,
        onSelectLesson: (selected) => {
          window.location.hash = "lesson/" + selected;
        },
      });
    }
  }

  mountCodeViewer({ container: dom.view });
  announce("Opened lesson: " + lesson.title + ".");
}

async function loadLesson(fileName) {
  if (state.lessonCache.has(fileName)) {
    return state.lessonCache.get(fileName);
  }

  const response = await fetch("../content/lessons/" + fileName);
  if (!response.ok) {
    const fallback = {
      title: "Lesson unavailable",
      html: "<p>Unable to load lesson content.</p>",
      quizzes: [],
    };
    state.lessonCache.set(fileName, fallback);
    return fallback;
  }

  const markdown = await response.text();
  const parsed = parseLesson(markdown);
  state.lessonCache.set(fileName, parsed);
  return parsed;
}

function parseLesson(markdown) {
  const lines = markdown.split(/\r?\n/);
  const quizSections = [];
  const keptLines = [];
  let inQuiz = false;
  let quizBuffer = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^#{2,3}\s+Self-check quiz\s*$/i.test(line.trim())) {
      inQuiz = true;
      quizBuffer = [];
      continue;
    }

    if (inQuiz && /^---\s*$/.test(line.trim())) {
      inQuiz = false;
      quizSections.push(parseQuizSection(quizBuffer));
      quizBuffer = [];
      continue;
    }

    if (inQuiz) {
      quizBuffer.push(line);
      continue;
    }

    keptLines.push(line);
  }

  if (inQuiz && quizBuffer.length > 0) {
    quizSections.push(parseQuizSection(quizBuffer));
  }

  const titleLine = keptLines.find((line) => /^#\s+/.test(line)) || "# Lesson";
  const title = titleLine.replace(/^#\s+/, "").trim();
  const html = markdownToHtml(keptLines.join("\n"));
  const quizzes = quizSections.flat().filter((entry) => entry && entry.question);

  return { title, html, quizzes };
}

function parseQuizSection(lines) {
  const quizzes = [];
  let current = null;

  lines.forEach((raw) => {
    const line = raw.trim();
    if (!line) {
      return;
    }

    const qMatch = line.match(/^\d+\.\s+(.+)/);
    if (qMatch) {
      if (current) {
        quizzes.push(current);
      }
      current = { question: qMatch[1].trim(), options: [], answer: "", explanation: "" };
      return;
    }

    const optMatch = line.match(/^([A-D])\)\s+(.+)/i);
    if (optMatch && current) {
      current.options.push({ key: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
      return;
    }

    const answerMatch = line.match(/^Answer:\s*([A-D])/i);
    if (answerMatch && current) {
      current.answer = answerMatch[1].toUpperCase();
      return;
    }

    const explanationMatch = line.match(/^Explanation:\s*(.+)/i);
    if (explanationMatch && current) {
      current.explanation = explanationMatch[1].trim();
    }
  });

  if (current) {
    quizzes.push(current);
  }

  return quizzes;
}

function markdownToHtml(markdown) {
  const placeholders = [];
  const source = markdown.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang = "", code = "") => {
    const token = "__CODE_BLOCK_" + placeholders.length + "__";
    placeholders.push(
      '<pre><code class="language-' +
        escapeHtml(lang || "text") +
        '">' +
        escapeHtml(code.replace(/\n$/, "")) +
        "</code></pre>"
    );
    return token;
  });

  const lines = source.split(/\r?\n/);
  const out = [];
  let paragraph = [];
  let inList = false;
  let listType = "";
  let inTable = false;

  function flushParagraph() {
    if (paragraph.length === 0) {
      return;
    }
    out.push("<p>" + formatInline(paragraph.join(" ")) + "</p>");
    paragraph = [];
  }

  function closeList() {
    if (!inList) {
      return;
    }
    out.push("</" + listType + ">");
    inList = false;
    listType = "";
  }

  function openList(type) {
    if (inList && listType === type) {
      return;
    }
    closeList();
    out.push("<" + type + ">");
    inList = true;
    listType = type;
  }

  function closeTable() {
    if (!inTable) {
      return;
    }
    out.push("</tbody></table>");
    inTable = false;
  }

  function parseTableRow(raw) {
    if (!raw.includes("|")) {
      return null;
    }
    const cleaned = raw.trim().replace(/^\|/, "").replace(/\|$/, "");
    const parts = [];
    let current = "";

    for (let idx = 0; idx < cleaned.length; idx += 1) {
      const char = cleaned[idx];
      const prev = idx > 0 ? cleaned[idx - 1] : "";
      if (char === "|" && prev !== "\\") {
        parts.push(current.trim().replace(/\\\|/g, "|").replace(/\\\\/g, "\\"));
        current = "";
        continue;
      }
      current += char;
    }
    parts.push(current.trim().replace(/\\\|/g, "|").replace(/\\\\/g, "\\"));

    if (parts.length < 2 || parts.some((part) => part.length === 0)) {
      return null;
    }
    return parts;
  }

  function isTableSeparator(raw) {
    return /^\|?\s*:?[-]{3,}:?\s*(\|\s*:?[-]{3,}:?\s*)+\|?$/.test(raw.trim());
  }

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      flushParagraph();
      closeList();
      closeTable();
      continue;
    }

    const codeToken = trimmed.match(/^__CODE_BLOCK_(\d+)__$/);
    if (codeToken) {
      flushParagraph();
      closeList();
      closeTable();
      out.push(placeholders[Number(codeToken[1])] || "");
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)/);
    if (heading) {
      flushParagraph();
      closeList();
      closeTable();
      const level = Math.min(4, heading[1].length + 1);
      out.push("<h" + level + ">" + formatInline(heading[2]) + "</h" + level + ">");
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      flushParagraph();
      closeList();
      closeTable();
      out.push("<hr />");
      continue;
    }

    const blockQuote = trimmed.match(/^>\s+(.+)/);
    if (blockQuote) {
      flushParagraph();
      closeList();
      closeTable();
      out.push("<blockquote>" + formatInline(blockQuote[1]) + "</blockquote>");
      continue;
    }

    const tableRow = parseTableRow(trimmed);
    if (tableRow) {
      const nextLine = lines[i + 1] || "";
      const isSeparator = isTableSeparator(nextLine);
      flushParagraph();
      closeList();

      if (!inTable && isSeparator) {
        out.push("<table><thead><tr>" + tableRow.map((cell) => "<th>" + formatInline(cell) + "</th>").join("") + "</tr></thead><tbody>");
        inTable = true;
        i += 1;
        continue;
      }

      if (inTable) {
        out.push("<tr>" + tableRow.map((cell) => "<td>" + formatInline(cell) + "</td>").join("") + "</tr>");
        continue;
      }
    }

    const listItem = lines[i].match(/^(\s*)\-\s+(.+)/);
    if (listItem) {
      flushParagraph();
      closeTable();
      openList("ul");
      const indentLevel = Math.min(6, Math.floor(listItem[1].length / 2));
      out.push('<li class="indent-' + indentLevel + '">' + formatInline(listItem[2]) + "</li>");
      continue;
    }

    const orderedItem = lines[i].match(/^(\s*)\d+\.\s+(.+)/);
    if (orderedItem) {
      flushParagraph();
      closeTable();
      openList("ol");
      const indentLevel = Math.min(6, Math.floor(orderedItem[1].length / 2));
      out.push('<li class="indent-' + indentLevel + '">' + formatInline(orderedItem[2]) + "</li>");
      continue;
    }

    closeList();
    closeTable();

    paragraph.push(trimmed);
  }

  flushParagraph();
  closeList();
  closeTable();
  return out.join("\n");
}

function formatInline(value) {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightPython(code) {
  const escaped = String(code)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const withComments = escaped.replace(/(#.*)$/gm, '<span class="tok-comment">$1</span>');
  const withStrings = withComments.replace(/("[^"]*"|'[^']*')/g, '<span class="tok-string">$1</span>');
  return withStrings.replace(
    /\b(import|from|as|def|class|return|for|while|if|elif|else|try|except|with|in|not|and|or|True|False|None|print)\b/g,
    '<span class="tok-keyword">$1</span>'
  );
}

export function mountCodeViewer(options) {
  const { container } = options;
  if (!container) {
    return;
  }

  container.querySelectorAll("pre code").forEach((node, idx) => {
    const pre = node.closest("pre");
    if (!pre || pre.classList.contains("is-upgraded")) {
      return;
    }

    pre.classList.add("is-upgraded");
    const source = node.textContent || "";
    node.innerHTML = highlightPython(source);

    const block = document.createElement("div");
    block.className = "code-shell";
    const head = document.createElement("div");
    head.className = "code-head";
    head.innerHTML = '<span>Python snippet ' + String(idx + 1) + '</span><button type="button" class="copy-btn">Copy</button>';

    pre.parentNode.insertBefore(block, pre);
    block.appendChild(head);
    block.appendChild(pre);

    const copyBtn = head.querySelector(".copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(source);
          copyBtn.textContent = "Copied";
          window.setTimeout(() => {
            copyBtn.textContent = "Copy";
          }, 1200);
        } catch {
          copyBtn.textContent = "Failed";
          window.setTimeout(() => {
            copyBtn.textContent = "Copy";
          }, 1200);
        }
      });
    }
  });
}

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { HelpLibraryDoc } from "../api";

interface HelpLibraryPanelProps {
  open: boolean;
  loading: boolean;
  markdown: string;
  docs: HelpLibraryDoc[];
  onClose: () => void;
}

interface TocEntry {
  level: number;
  title: string;
  id: string;
}

function estimateReadMinutes(markdown: string): number {
  const words = String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`\-\[\]()]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function slugifyHeading(value: string): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\[\]()*`_~!@#$%^&+=|\\:;"'<>,.?/]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function flattenNodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(flattenNodeText).join("");
  }
  if (typeof node === "object" && "props" in node) {
    const withProps = node as { props?: { children?: ReactNode } };
    return flattenNodeText(withProps.props?.children ?? "");
  }
  return "";
}

function normalizeMarkdown(markdown: string): string {
  return String(markdown || "")
    .replace(/\u00a0/g, " ")
    .replace(/\u200b/g, "")
    .replace(/\r\n?/g, "\n");
}

function extractTocEntries(markdown: string): TocEntry[] {
  const lines = normalizeMarkdown(markdown).split("\n");
  const entries: TocEntry[] = [];
  const used = new Map<string, number>();
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }

    const match = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
    if (!match) {
      continue;
    }

    const level = match[1].length;
    const title = match[2].replace(/[*_`~]/g, "").trim();
    if (!title) {
      continue;
    }

    const base = slugifyHeading(title) || "section";
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    const id = count > 0 ? `${base}-${count + 1}` : base;
    entries.push({ level, title, id });
  }

  return entries;
}

export function HelpLibraryPanel({ open, loading, markdown, docs, onClose }: HelpLibraryPanelProps) {
  const [selectedDocId, setSelectedDocId] = useState("");
  const [search, setSearch] = useState("");
  const [fontScale, setFontScale] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState("");
  const [collapsedTocIds, setCollapsedTocIds] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setScrollProgress(0);
    }
  }, [open]);

  useEffect(() => {
    if (!docs.length) {
      setSelectedDocId("");
      return;
    }
    if (!selectedDocId || !docs.some((doc) => doc.id === selectedDocId)) {
      setSelectedDocId(docs[0].id);
    }
  }, [docs, selectedDocId]);

  const selectedDoc = useMemo(() => {
    if (!docs.length) {
      return null;
    }
    return docs.find((doc) => doc.id === selectedDocId) || docs[0];
  }, [docs, selectedDocId]);

  const displayedMarkdown = selectedDoc?.markdown || markdown;
  const normalizedMarkdown = useMemo(() => normalizeMarkdown(displayedMarkdown), [displayedMarkdown]);
  const normalizedSearch = search.trim().toLowerCase();
  const isSearchMatch = !normalizedSearch || normalizedMarkdown.toLowerCase().includes(normalizedSearch);

  const tocEntries = useMemo(() => extractTocEntries(normalizedMarkdown), [normalizedMarkdown]);

  useEffect(() => {
    setActiveHeadingId(tocEntries[0]?.id || "");
    setCollapsedTocIds([]);
  }, [tocEntries]);

  const tocRows = useMemo(() => {
    function hasChildren(index: number): boolean {
      if (index >= tocEntries.length - 1) {
        return false;
      }
      return tocEntries[index + 1].level > tocEntries[index].level;
    }

    function isHidden(index: number): boolean {
      let parentLevel = tocEntries[index].level;
      for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
        if (tocEntries[cursor].level < parentLevel) {
          if (collapsedTocIds.includes(tocEntries[cursor].id)) {
            return true;
          }
          parentLevel = tocEntries[cursor].level;
        }
      }
      return false;
    }

    return tocEntries.map((entry, index) => ({
      entry,
      hasChildren: hasChildren(index),
      hidden: isHidden(index),
      collapsed: collapsedTocIds.includes(entry.id),
    }));
  }, [tocEntries, collapsedTocIds]);

  const headingComponents = useMemo(() => {
    const used = new Map<string, number>();

    function buildHeading(levelClass: string) {
      return function HeadingRenderer({ children }: { children?: ReactNode }) {
        const text = flattenNodeText(children || "").replace(/\s+/g, " ").trim();
        const base = slugifyHeading(text) || "section";
        const count = used.get(base) || 0;
        used.set(base, count + 1);
        const id = count > 0 ? `${base}-${count + 1}` : base;
        return (
          <div className="help-heading-wrap">
            {levelClass === "h1" ? <h1 id={id}>{children}</h1> : null}
            {levelClass === "h2" ? <h2 id={id}>{children}</h2> : null}
            {levelClass === "h3" ? <h3 id={id}>{children}</h3> : null}
            <a className="help-heading-link" href={`#${id}`} aria-label={`Jump to ${text}`}>
              #
            </a>
          </div>
        );
      };
    }

    return {
      h1: buildHeading("h1"),
      h2: buildHeading("h2"),
      h3: buildHeading("h3"),
    };
  }, [normalizedMarkdown]);

  function jumpToHeading(id: string) {
    if (!contentRef.current) {
      return;
    }
    const target = contentRef.current.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null;
    if (!target) {
      return;
    }
    setActiveHeadingId(id);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateActiveHeading(container: HTMLDivElement) {
    if (!tocEntries.length) {
      setActiveHeadingId("");
      return;
    }

    const scrollTop = container.scrollTop;
    const threshold = scrollTop + 48;
    let current = tocEntries[0].id;

    for (const entry of tocEntries) {
      const heading = container.querySelector(`#${CSS.escape(entry.id)}`) as HTMLElement | null;
      if (!heading) {
        continue;
      }
      if (heading.offsetTop <= threshold) {
        current = entry.id;
      } else {
        break;
      }
    }

    setActiveHeadingId(current);
  }

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const max = target.scrollHeight - target.clientHeight;
    const progress = max <= 0 ? 0 : Math.min(100, Math.round((target.scrollTop / max) * 100));
    setScrollProgress(progress);
    updateActiveHeading(target);
  }

  useEffect(() => {
    if (!contentRef.current || loading) {
      return;
    }
    updateActiveHeading(contentRef.current);
  }, [loading, normalizedMarkdown, tocEntries]);

  if (!open) {
    return null;
  }

  return (
    <aside className="help-overlay" role="dialog" aria-modal="true" aria-label="Help Library">
      <section className="help-panel">
        <div className="help-header">
          <h2>Help Library</h2>
          <button className="danger-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="help-toolbar" role="region" aria-label="Help reading controls">
          <div className="help-control">
            Documents
            <div className="help-doc-tabs" role="tablist" aria-label="Help documents">
              {docs.length ? (
                docs.map((doc) => {
                  const active = (selectedDoc?.id || "") === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={`help-doc-tab${active ? " is-active" : ""}`}
                      onClick={() => setSelectedDocId(doc.id)}
                    >
                      {doc.title}
                    </button>
                  );
                })
              ) : (
                <button type="button" role="tab" aria-selected={true} className="help-doc-tab is-active" disabled>
                  Combined Help Library
                </button>
              )}
            </div>
          </div>
          <label className="help-control">
            Search in document
            <input
              className="text-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Type keyword, concept, or section"
            />
          </label>
          <div className="help-inline-controls">
            <button
              className="primary-btn"
              type="button"
              onClick={() => setFontScale((current) => Math.max(0.85, Number((current - 0.1).toFixed(2))))}
              title="Decrease font size"
            >
              A-
            </button>
            <button
              className="primary-btn"
              type="button"
              onClick={() => setFontScale(1)}
              title="Reset font size"
            >
              Reset
            </button>
            <button
              className="primary-btn"
              type="button"
              onClick={() => setFontScale((current) => Math.min(1.35, Number((current + 0.1).toFixed(2))))}
              title="Increase font size"
            >
              A+
            </button>
          </div>
        </div>
        <div className="help-meta-row muted">
          <span>
            {selectedDoc ? `${selectedDoc.title} (${selectedDoc.fileName})` : "Combined Help Library"}
          </span>
          <span>{estimateReadMinutes(displayedMarkdown)} min read</span>
          <span>{scrollProgress}% read</span>
        </div>
        <div className="help-progress" aria-hidden="true">
          <div className="help-progress-fill" style={{ width: `${scrollProgress}%` }} />
        </div>
        {tocEntries.length > 0 ? (
          <div className="help-toc" role="navigation" aria-label="Document table of contents">
            <div className="help-toc-controls">
              <span className="help-toc-label">Contents</span>
              <button
                type="button"
                className="help-toc-action"
                onClick={() =>
                  setCollapsedTocIds(
                    tocRows.filter((r) => r.hasChildren).map((r) => r.entry.id)
                  )
                }
              >
                Collapse all
              </button>
              <button
                type="button"
                className="help-toc-action"
                onClick={() => setCollapsedTocIds([])}
              >
                Expand all
              </button>
            </div>
            {tocRows.map(({ entry, hasChildren, hidden, collapsed }) =>
              hidden ? null : (
                <div key={entry.id} className="help-toc-row">
                  <button
                    type="button"
                    className={`help-toc-item help-toc-item--l${entry.level}${activeHeadingId === entry.id ? " is-active" : ""}`}
                    onClick={() => jumpToHeading(entry.id)}
                  >
                    {entry.title}
                  </button>
                  {hasChildren ? (
                    <button
                      type="button"
                      className="help-toc-toggle"
                      onClick={() =>
                        setCollapsedTocIds((current) =>
                          current.includes(entry.id) ? current.filter((id) => id !== entry.id) : [...current, entry.id]
                        )
                      }
                      aria-label={collapsed ? `Expand ${entry.title}` : `Collapse ${entry.title}`}
                      title={collapsed ? "Expand section" : "Collapse section"}
                    >
                      {collapsed ? "+" : "-"}
                    </button>
                  ) : null}
                </div>
              )
            )}
          </div>
        ) : null}
        <div
          ref={contentRef}
          className="help-content mono"
          style={{ fontSize: `${fontScale}em` }}
          onScroll={handleScroll}
        >
          {loading ? (
            "Loading help library..."
          ) : !isSearchMatch ? (
            <p>No exact match found for "{search}" in this document.</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={headingComponents}>
              {normalizedMarkdown}
            </ReactMarkdown>
          )}
        </div>
      </section>
    </aside>
  );
}

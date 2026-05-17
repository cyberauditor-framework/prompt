import { ExecuteResult } from "../types";

interface ExecutionSandboxProps {
  halted: boolean;
  setHalted: (value: boolean) => void;
  modelA: string;
  setModelA: (value: string) => void;
  modelB: string;
  setModelB: (value: string) => void;
  runComparison: () => Promise<void>;
  resultA?: ExecuteResult;
  resultB?: ExecuteResult;
}

export function ExecutionSandbox({
  halted,
  setHalted,
  modelA,
  setModelA,
  modelB,
  setModelB,
  runComparison,
  resultA,
  resultB,
}: ExecutionSandboxProps) {
  return (
    <section className="panel sandbox-panel">
      <div className="panel-header">
        <h2>Execution Sandbox</h2>
        <p>Internal feedback loop plus side-by-side model diff</p>
      </div>

      <div className="sandbox-controls">
        <label>
          Model A
          <input className="text-input" value={modelA} onChange={(e) => setModelA(e.target.value)} />
        </label>
        <label>
          Model B
          <input className="text-input" value={modelB} onChange={(e) => setModelB(e.target.value)} />
        </label>
        <button className="danger-btn" onClick={() => setHalted(!halted)}>
          {halted ? "Resume" : "Halt"}
        </button>
        <button className="primary-btn" onClick={runComparison}>
          Run Diff
        </button>
      </div>

      <div className="diff-grid">
        <article className="diff-card">
          <h3>{modelA}</h3>
          <p className="mono">{resultA?.hiddenReasoning ?? "No run yet."}</p>
          <pre className="mono">{resultA?.outputText ?? "No output yet."}</pre>
        </article>
        <article className="diff-card">
          <h3>{modelB}</h3>
          <p className="mono">{resultB?.hiddenReasoning ?? "No run yet."}</p>
          <pre className="mono">{resultB?.outputText ?? "No output yet."}</pre>
        </article>
      </div>
    </section>
  );
}

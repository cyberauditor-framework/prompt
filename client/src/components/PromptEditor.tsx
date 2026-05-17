interface PromptEditorProps {
  goal: string;
  setGoal: (value: string) => void;
  agentType: string;
  setAgentType: (value: string) => void;
  variables: Record<string, string>;
  setVariables: (value: Record<string, string>) => void;
  finalPrompt: string;
  compileNow: () => Promise<void>;
}

export function PromptEditor({
  goal,
  setGoal,
  agentType,
  setAgentType,
  variables,
  setVariables,
  finalPrompt,
  compileNow,
}: PromptEditorProps) {
  return (
    <section className="panel editor-panel">
      <div className="panel-header">
        <h2>Prompt Editor</h2>
        <p>Live prompt injection with variable management</p>
      </div>

      <label className="field-label">Mission Goal</label>
      <textarea
        className="text-area"
        rows={3}
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      />

      <label className="field-label">Agent Type</label>
      <input
        className="text-input"
        value={agentType}
        onChange={(e) => setAgentType(e.target.value)}
      />

      <label className="field-label">Variables</label>
      <div className="vars-grid">
        {Object.keys(variables).map((key) => (
          <div className="var-row" key={key}>
            <span>{`{{${key}}}`}</span>
            <input
              className="text-input"
              value={variables[key]}
              onChange={(e) => setVariables({ ...variables, [key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <button className="primary-btn" onClick={compileNow}>
        Compile Prompt Draft
      </button>

      <label className="field-label">Compiled Prompt</label>
      <textarea className="text-area mono" rows={13} value={finalPrompt} readOnly />
    </section>
  );
}

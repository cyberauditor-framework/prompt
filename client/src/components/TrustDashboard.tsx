import { RoutingDecision } from "../types";

interface TrustDashboardProps {
  routing?: RoutingDecision;
  trace: string[];
}

export function TrustDashboard({ routing, trace }: TrustDashboardProps) {
  const confidencePct = Math.round((routing?.confidence || 0) * 100);

  return (
    <section className="panel trust-panel">
      <div className="panel-header">
        <h2>Trust Dashboard</h2>
        <p>Routing confidence, traceability, and human oversight</p>
      </div>

      <div className="confidence-row">
        <span>Route: {routing?.route || "N/A"}</span>
        <span>{confidencePct}%</span>
      </div>
      <div className="confidence-bar">
        <div className="confidence-fill" style={{ width: `${confidencePct}%` }} />
      </div>
      <p className="muted">{routing?.reason || "Compile a prompt to compute routing."}</p>

      <h3>Routing Trace</h3>
      <ul className="trace-list">
        {trace.length === 0 ? <li>No trace yet.</li> : trace.map((item, idx) => <li key={idx}>{item}</li>)}
      </ul>
    </section>
  );
}

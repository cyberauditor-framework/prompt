# Workflow Step 6: Deployment and Monitoring

**Title and one-line definition**
Deployment and Monitoring operationalize models in production and continuously track data/model health to trigger maintenance.

## Intuition
A deployed model is a living system, not a one-time artifact. Data changes, user behavior shifts, and upstream pipelines evolve. Monitoring ensures that once-good models do not silently degrade. Retraining and rollback playbooks are as important as initial training.

## How it actually works
Package model with reproducible preprocessing, expose inference service, and log predictions/outcomes. Monitor data drift (input distribution shift), model drift (performance decay), latency, and error rates. Use retraining triggers (metric thresholds, drift alarms, schedule) and controlled experiments like A/B tests for safe upgrades.

## Real-world examples
- Credit scoring models retrained monthly when PSI exceeds threshold.
- Recommendation systems evaluated via A/B click-through and retention.
- Fraud models with daily drift checks and rapid rollback gates.

## Strategic benefits
- Prevents silent degradation and revenue loss.
- Enables evidence-based model updates with A/B testing.
- Improves reliability, compliance, and incident response.

## Limitations and failure modes
- Missing ground-truth feedback delays performance detection.
- Alert fatigue from poorly tuned thresholds.
- Retraining without governance can cause instability.

## Code snippet (Python, runnable)
```python
# Simple drift and retraining trigger simulation
import numpy as np

rng = np.random.default_rng(42)
train_scores = rng.normal(loc=0.50, scale=0.08, size=2000)
prod_scores = rng.normal(loc=0.62, scale=0.10, size=2000)

# Population Stability Index (PSI) approximation
bins = np.linspace(0.0, 1.0, 11)
train_hist, _ = np.histogram(train_scores, bins=bins)
prod_hist, _ = np.histogram(prod_scores, bins=bins)
train_pct = np.clip(train_hist / train_hist.sum(), 1e-6, None)
prod_pct = np.clip(prod_hist / prod_hist.sum(), 1e-6, None)
psi = np.sum((prod_pct - train_pct) * np.log(prod_pct / train_pct))

current_auc = 0.84
baseline_auc = 0.89
auc_drop = baseline_auc - current_auc

trigger_retrain = (psi > 0.2) or (auc_drop > 0.03)
print("PSI:", round(float(psi), 4))
print("AUC drop:", round(float(auc_drop), 4))
print("Retrain trigger:", bool(trigger_retrain))
```

## Diagram description
Production inference service -> monitoring layer (data drift, model drift, latency) -> trigger engine -> retraining pipeline -> canary/A-B deployment.

## Self-check quiz
1. Data drift refers to:
A) Model architecture change
B) Shift in input feature distributions over time
C) Loss function bug only
D) Tokenizer version mismatch only

Answer: B
Explanation: Data drift is change in input data characteristics.

2. A/B testing in model deployment is used to:
A) Randomly delete logs
B) Compare candidate model impact against baseline safely
C) Replace offline validation entirely
D) Disable monitoring

Answer: B
Explanation: Controlled experiments measure real-world lift and risk.

3. A robust retraining trigger should combine:
A) One metric and no drift checks
B) Drift signals plus performance degradation thresholds
C) Manual intuition only
D) Calendar date only

Answer: B
Explanation: Multi-signal triggers reduce false alarms and misses.

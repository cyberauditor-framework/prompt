# Workflow Step 1: Problem Definition

**Title and one-line definition**
Problem Definition formalizes business objective, prediction target, constraints, and success criteria before modeling.

## Intuition
Most AI failures start as framing failures, not model failures. If you optimize the wrong target, even perfect training will produce poor business outcomes. This step translates a business question into a measurable ML objective with clear boundaries and assumptions.

## How it actually works
Define decision context, target variable, prediction horizon, actionability, and constraints (latency, fairness, privacy, budget). Establish baseline and success metrics tied to impact. Create an experiment contract covering data scope, leakage checks, and deployment acceptance thresholds.

## Real-world examples
- Predict 30-day churn to trigger retention offers.
- Forecast demand by SKU for weekly procurement.
- Rank suspicious transactions for fraud review.

## Strategic benefits
- Aligns teams on objective and tradeoffs early.
- Prevents costly rework due to ambiguous goals.
- Improves deployability by making constraints explicit.

## Limitations and failure modes
- Vague objective leads to metric gaming.
- Wrong target proxy reduces true business value.
- Missing constraints causes non-deployable models.

## Code snippet (Python, runnable)
```python
# Problem definition as a typed config artifact
from dataclasses import dataclass
from typing import List

@dataclass
class MLProblemSpec:
    objective: str
    target: str
    prediction_horizon_days: int
    primary_metric: str
    secondary_metrics: List[str]
    latency_ms_budget: int
    fairness_constraint: str

spec = MLProblemSpec(
    objective="Reduce voluntary churn by prioritizing outreach",
    target="churn_30d",
    prediction_horizon_days=30,
    primary_metric="recall_at_top_10pct",
    secondary_metrics=["precision", "roc_auc", "calibration_error"],
    latency_ms_budget=80,
    fairness_constraint="No subgroup recall gap > 5 percentage points",
)

print("Problem objective:", spec.objective)
print("Target:", spec.target)
print("Primary metric:", spec.primary_metric)
print("Constraints:", {"latency_ms": spec.latency_ms_budget, "fairness": spec.fairness_constraint})
```

## Diagram description
Business question -> ML problem spec -> metric and constraint contract -> modeling pipeline entry.

## Self-check quiz
1. Primary output of this step is:
A) Final model weights
B) Clear objective/target/metric/constraint specification
C) Confusion matrix only
D) Feature importance chart

Answer: B
Explanation: Problem framing artifacts guide all downstream decisions.

2. A common framing failure is:
A) Monitoring drift
B) Optimizing an easy proxy unrelated to business value
C) Normalizing features
D) Using train/test split

Answer: B
Explanation: Proxy mismatch can make metrics look good but outcomes poor.

3. Why define constraints early?
A) To avoid writing code
B) To ensure models are deployable under real requirements
C) To increase parameter count
D) To remove evaluation

Answer: B
Explanation: Latency, fairness, and compliance are deployment gates.

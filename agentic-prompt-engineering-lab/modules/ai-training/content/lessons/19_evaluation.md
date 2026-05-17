# Workflow Step 5: Evaluation

**Title and one-line definition**
Evaluation measures model quality against task-relevant metrics to validate readiness for deployment.

## Intuition
A single metric cannot capture all tradeoffs. For classification, accuracy may hide class-imbalance issues, so precision/recall/F1 and ROC-AUC provide additional views. Confusion matrix reveals where errors concentrate. Evaluation should mirror production decision costs.

## How it actually works
Run on held-out test or robust validation protocol. Compute metrics: Accuracy, Precision, Recall, F1, ROC-AUC, confusion matrix. Add calibration and subgroup analysis when needed. Select operating thresholds based on business utility curves.

## Real-world examples
- Fraud systems tuned for high recall at review-capacity constraints.
- Healthcare triage prioritizing sensitivity to avoid missed positives.
- Churn scoring balancing retention spend and false alarms.

## Strategic benefits
- Quantifies whether model meets acceptance criteria.
- Supports threshold decisions tied to operations.
- Surfaces risk concentrations before deployment.

## Limitations and failure modes
- Test set leakage invalidates conclusions.
- Metric mismatch with business objective causes poor impact.
- Ignoring subgroup disparities creates fairness risk.

## Code snippet (Python, runnable)
```python
# Evaluation metrics summary in scikit-learn
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)

X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

clf = LogisticRegression(max_iter=3000)
clf.fit(X_train, y_train)

pred = clf.predict(X_test)
prob = clf.predict_proba(X_test)[:, 1]

print("Accuracy:", round(accuracy_score(y_test, pred), 4))
print("Precision:", round(precision_score(y_test, pred), 4))
print("Recall:", round(recall_score(y_test, pred), 4))
print("F1:", round(f1_score(y_test, pred), 4))
print("ROC-AUC:", round(roc_auc_score(y_test, prob), 4))
print("Confusion matrix:\n", confusion_matrix(y_test, pred))
```

## Diagram description
Evaluation dashboard panel containing metric cards (Accuracy, Precision, Recall, F1, ROC-AUC) plus confusion matrix heatmap.

## Self-check quiz
1. In imbalanced classification, relying only on accuracy is risky because:
A) Accuracy cannot be computed
B) It may hide poor minority-class detection
C) It is always lower than recall
D) It equals ROC-AUC

Answer: B
Explanation: High accuracy can coexist with low recall on rare positives.

2. ROC-AUC measures:
A) Calibration error only
B) Ranking quality across thresholds
C) Mean squared error
D) Cluster compactness

Answer: B
Explanation: AUC captures separability across all thresholds.

3. Confusion matrix helps identify:
A) Token counts
B) Specific types of false positives and false negatives
C) Feature importances only
D) GPU memory

Answer: B
Explanation: It decomposes prediction outcomes by true/predicted class.

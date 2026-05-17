# Semi-Supervised Learning

**Title and one-line definition**
Semi-Supervised Learning uses a small labeled dataset plus a larger unlabeled dataset to improve model performance.

## Intuition
You have a few audited examples and a massive pile of unlabeled data. Semi-supervised learning treats labeled points as anchors and uses unlabeled structure to shape better decision boundaries. It is like learning with a handful of graded homework and many ungraded practice sheets. The method works best when unlabeled samples come from the same distribution as labeled ones.

## How it actually works
Typical approaches include pseudo-labeling, consistency regularization, and graph-based label propagation. In pseudo-labeling, model predicts labels on unlabeled data, keeps high-confidence predictions, then retrains on combined data. Consistency methods enforce stable predictions under input perturbations. Objective combines supervised loss and unsupervised regularization terms.

## Real-world examples
- Medical imaging where expert annotation is expensive.
- Moderation pipelines with limited human-reviewed labels.
- Industrial defect detection with few labeled fault cases.

## Strategic benefits
- Reduces labeling cost while improving accuracy over purely supervised baselines.
- Better representation learning from broader unlabeled coverage.
- Practical bridge toward active learning loops.

## Limitations and failure modes
- Confirmation bias from incorrect pseudo-labels.
- Performance drops under domain mismatch between labeled and unlabeled sets.
- Confidence thresholds require careful calibration.

## Code snippet (Python, runnable)
```python
# Semi-supervised classification with LabelSpreading
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.semi_supervised import LabelSpreading
from sklearn.metrics import accuracy_score
import numpy as np

X, y = load_digits(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

# Keep only a small labeled subset
rng = np.random.default_rng(42)
mask = rng.random(y_train.shape[0]) < 0.1
semi_labels = np.full_like(y_train, fill_value=-1)
semi_labels[mask] = y_train[mask]

model = LabelSpreading(kernel="rbf", gamma=0.25, alpha=0.2, max_iter=50)
model.fit(X_train, semi_labels)

pred = model.predict(X_test)
print("Labeled fraction:", round(mask.mean(), 3))
print("Test accuracy:", round(accuracy_score(y_test, pred), 4))
```

## Diagram description
Small labeled node set and large unlabeled node set feed into a joint learner; confident pseudo-labels loop back into training set.

## Self-check quiz
1. Semi-supervised learning is most useful when:
A) Labeled data is abundant and cheap
B) Labels are scarce but unlabeled data is plentiful
C) No data exists
D) Only reinforcement signals exist

Answer: B
Explanation: It is designed for low-label, high-unlabeled regimes.

2. A major risk of pseudo-labeling is:
A) Infinite memory use always
B) Amplifying model mistakes
C) Inability to train any model
D) No need for validation

Answer: B
Explanation: Wrong pseudo-labels can reinforce errors.

3. Unlabeled data helps most when it is:
A) From unrelated domain
B) Distributionally aligned with target task
C) Random noise only
D) Synthetic labels only

Answer: B
Explanation: Domain alignment is critical for useful structure transfer.

# Hyperparameter Tuning (Grid Search, Random Search, Bayesian Optimization)

**Title and one-line definition**
Hyperparameter tuning is the process of selecting model/training settings that maximize validation performance.

## Intuition
Model architecture and training knobs (depth, LR, regularization) strongly affect quality. Tuning is structured experimentation over configuration space. Grid search is exhaustive but expensive, random search is broader and often more efficient, and Bayesian optimization uses previous results to pick promising next trials.

## How it actually works
Define search space and objective metric on validation/cross-validation. Execute trials with strategy: grid (cartesian combinations), random sampling, or Bayesian surrogate-guided selection (e.g., Gaussian process/TPE). Track experiments and choose best config by robust metrics, not a single lucky split.

## Real-world examples
- Optimizing fraud classifier recall at fixed precision.
- Reducing inference latency while preserving target AUC.
- Selecting tree depth/regularization for churn models.

## Strategic benefits
- 2 to 10 point metric gains without changing core model family.
- Better reliability from systematic search vs manual guessing.
- Supports objective tradeoff tuning (quality vs latency).

## Limitations and failure modes
- Compute-intensive for large spaces.
- Overfitting to validation set if tuning is excessive.
- Weak experiment tracking leads to irreproducible outcomes.

## Code snippet (Python, runnable)
```python
# Grid + Random search example in scikit-learn
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from sklearn.ensemble import RandomForestClassifier
from scipy.stats import randint

X, y = load_breast_cancer(return_X_y=True)
base = RandomForestClassifier(random_state=42, n_jobs=-1)

grid = GridSearchCV(
    base,
    param_grid={"n_estimators": [100, 200], "max_depth": [None, 6, 12]},
    cv=3,
    scoring="roc_auc",
)
grid.fit(X, y)

rand = RandomizedSearchCV(
    base,
    param_distributions={"n_estimators": randint(80, 300), "max_depth": randint(3, 20)},
    n_iter=10,
    cv=3,
    random_state=42,
    scoring="roc_auc",
)
rand.fit(X, y)

print("Best Grid AUC:", round(grid.best_score_, 4), grid.best_params_)
print("Best Random AUC:", round(rand.best_score_, 4), rand.best_params_)
```

## Diagram description
Search controller block with three strategy lanes (Grid, Random, Bayesian) feeding trial evaluator; results database loops back to strategy selection.

## Self-check quiz
1. For many dimensions, random search often beats grid because:
A) It evaluates every point
B) It covers more unique values per important dimension under fixed budget
C) It ignores objective
D) It requires labels

Answer: B
Explanation: Random sampling allocates budget more efficiently in high dimensions.

2. Bayesian optimization uses prior trial outcomes to:
A) Randomly stop training
B) Suggest promising next configurations
C) Remove model metrics
D) Replace cross-validation

Answer: B
Explanation: It balances exploration and exploitation via a surrogate/acquisition.

3. Tuning risk to manage:
A) Validation overfitting
B) Impossible model training
C) No need for metrics
D) Deterministic global optimum assumption

Answer: A
Explanation: Repeatedly optimizing on one validation split can overfit.

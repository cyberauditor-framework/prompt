# Workflow Step 2: Data Preparation

**Title and one-line definition**
Data Preparation cleans, normalizes, and engineers features to make training data reliable, informative, and leakage-safe.

## Intuition
Raw data is usually incomplete, inconsistent, and noisy. Data preparation turns messy operational logs into model-ready signals. Better features often beat more complex models. This step strongly determines the upper bound of model quality.

## How it actually works
Pipeline includes schema checks, missing-value handling, outlier strategy, encoding, normalization/standardization, feature engineering, and leakage prevention. Split strategy must respect time/entity boundaries. Data transformations are fit on train only and applied to validation/test to prevent contamination.

## Real-world examples
- Building rolling-window demand features for forecasting.
- Encoding categorical payment methods for fraud scoring.
- Creating lag and seasonality indicators for time-series models.

## Strategic benefits
- Improves signal-to-noise ratio and model stability.
- Reduces train/serve skew by codifying transformations.
- Enables reproducible training and audits.

## Limitations and failure modes
- Leakage from future information can inflate offline metrics.
- Over-engineering creates brittle, hard-to-maintain features.
- Drift in upstream data schema breaks pipelines.

## Code snippet (Python, runnable)
```python
# Data preparation pipeline with scikit-learn
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer

# Toy tabular data
X = pd.DataFrame({
    "age": [25, 42, None, 36, 51],
    "income": [50000, 92000, 61000, None, 120000],
    "segment": ["A", "B", "A", "C", None],
})

num_cols = ["age", "income"]
cat_cols = ["segment"]

numeric_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])

categorical_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("ohe", OneHotEncoder(handle_unknown="ignore")),
])

prep = ColumnTransformer([
    ("num", numeric_pipe, num_cols),
    ("cat", categorical_pipe, cat_cols),
])

Xt = prep.fit_transform(X)
print("Prepared shape:", Xt.shape)
```

## Diagram description
Raw data -> quality checks -> cleaning/imputation -> encoding/scaling -> feature engineering -> train/val/test datasets.

## Self-check quiz
1. Leakage occurs when:
A) Training uses only current-row features
B) Future or target-derived information leaks into training inputs
C) Data is normalized
D) Categorical features are encoded

Answer: B
Explanation: Leakage invalidates evaluation by exposing forbidden information.

2. Why fit preprocessors on train only?
A) To increase memory usage
B) To avoid contamination of evaluation data
C) To remove all missing values globally
D) To reduce feature count always

Answer: B
Explanation: Validation/test should simulate unseen production data.

3. Strong feature engineering can:
A) Replace all evaluation
B) Improve model quality more than architecture changes in many tabular tasks
C) Eliminate drift forever
D) Make data collection unnecessary

Answer: B
Explanation: Better signal representation often dominates architecture tweaks.

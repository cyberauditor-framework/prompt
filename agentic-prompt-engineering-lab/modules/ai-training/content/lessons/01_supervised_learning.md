# Supervised Learning

**Title and one-line definition**
Supervised Learning is the paradigm where a model learns a mapping from inputs to known target labels using labeled examples.

## Intuition
Think of supervised learning like training a new analyst with answer keys. You show many historical cases, each with the final decision, and the analyst starts noticing patterns that predict the right outcome. Over time, the analyst can handle unseen cases by applying those learned patterns. The quality of decisions depends heavily on how representative and clean the training examples are. If labels are noisy or biased, the analyst learns the wrong habits.

## How it actually works
Given a dataset $D = {(x_i, y_i)}_{i=1}^{N}$, we learn parameters $\theta$ for a function $f_\theta(x)$ that minimize a loss function. For regression tasks, common loss is mean squared error: $\frac{1}{N}\sum_i (f_\theta(x_i)-y_i)^2$. For classification, common losses are log loss or hinge loss. Training typically uses gradient-based optimization (for differentiable models) or greedy split criteria (for trees). Generalization is validated with held-out data, cross-validation, and metrics aligned to business costs.

## Real-world examples
- Credit risk scoring for loan approval using repayment labels.
- Medical diagnosis support from labeled imaging or lab outcomes.
- Demand forecasting for inventory planning using historical sales.

## Strategic benefits
- Delivers predictable performance when high-quality labels exist.
- Easier to evaluate with direct target metrics (RMSE, F1, AUC).
- Supports clear feedback loops: collect labels, retrain, redeploy.

## Limitations and failure modes
- Label collection is expensive and may lag production reality.
- Spurious correlations can inflate offline metrics but fail in production.
- Class imbalance can create high accuracy with poor minority recall.

## Code snippet (Python, runnable)
```python
# Minimal supervised classification with scikit-learn
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score

# 1) Load labeled data (X features, y labels)
data = load_breast_cancer()
X, y = data.data, data.target

# 2) Train/validation split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

# 3) Build a supervised pipeline
model = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(max_iter=2000))
])

# 4) Fit on labeled training examples
model.fit(X_train, y_train)

# 5) Evaluate on unseen labeled test examples
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]
print(classification_report(y_test, y_pred, digits=3))
print("ROC-AUC:", round(roc_auc_score(y_test, y_prob), 4))
```

## Diagram description
Draw a left-to-right flow: Labeled Dataset -> Train Model -> Validation Metrics -> Deployed Predictor -> New Input -> Predicted Label. Annotate a feedback arrow from production outcomes back to Labeled Dataset.

## Self-check quiz
1. Which condition most strongly enables supervised learning success?
A) No labels but many samples
B) High-quality labeled data aligned with target behavior
C) Very deep model regardless of data
D) Random feature generation

Answer: B
Explanation: Supervised learning depends on reliable input-label pairs.

2. Which metric is usually inappropriate by itself on highly imbalanced binary classes?
A) Accuracy
B) Recall
C) Precision
D) ROC-AUC

Answer: A
Explanation: Accuracy can look high while minority-class detection is poor.

3. What is the core training objective in supervised learning?
A) Maximize entropy of outputs
B) Minimize loss between predictions and known targets
C) Remove all features with low variance
D) Randomly perturb labels for robustness

Answer: B
Explanation: Training minimizes an objective that quantifies prediction error.

---

## Sub-section: Linear Regression

### Title and one-line definition
Linear Regression fits a linear relationship between features and a continuous target.

### Intuition
It is like fitting the best straight trend line through scattered points so average error is as small as possible. Each feature contributes additively to the prediction with a learned weight. Positive weight pushes predictions up; negative pushes them down. It is simple, transparent, and often a strong baseline.

### How it actually works
Model: $\hat{y}=w^Tx+b$. Ordinary least squares minimizes $\sum_i (y_i-\hat{y}_i)^2$. Closed-form solution exists for full-rank design matrix, while practical implementations use SVD/QR solvers for numerical stability.

### Real-world examples
- House price estimation from square footage and location features.
- Revenue forecasting from ad spend and seasonality indicators.
- Sensor calibration from measured signal and ground-truth value.

### Strategic benefits
- Fast training and inference.
- Coefficients are interpretable.
- Works well when relationship is roughly linear.

### Limitations and failure modes
- Underfits nonlinear interactions.
- Sensitive to outliers and multicollinearity.
- Assumes additive linear effects.

### Code snippet (Python, runnable)
```python
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

X, y = load_diabetes(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=0
)

reg = LinearRegression()
reg.fit(X_train, y_train)

pred = reg.predict(X_test)
rmse = mean_squared_error(y_test, pred, squared=False)
r2 = r2_score(y_test, pred)

print("RMSE:", round(rmse, 3))
print("R2:", round(r2, 3))
print("First 5 coefficients:", reg.coef_[:5])
```

### Diagram description
Scatter plot with points and one fitted line; annotate slope and intercept.

### Self-check quiz
1. Linear regression predicts:
A) Class labels only
B) Probabilities only
C) Continuous values
D) Cluster IDs

Answer: C
Explanation: Linear regression is a regression method for continuous targets.

2. The objective minimized in OLS is:
A) Absolute error sum
B) Squared error sum
C) Hinge loss
D) KL divergence

Answer: B
Explanation: Ordinary least squares minimizes squared residuals.

3. Multicollinearity mainly harms:
A) Label count
B) Coefficient stability
C) Train/test split
D) Feature scaling only

Answer: B
Explanation: Correlated features make coefficient estimates unstable.

---

## Sub-section: Decision Trees

### Title and one-line definition
Decision Trees recursively split features to create if-then rules that predict labels or values.

### Intuition
Imagine twenty questions: each question splits possibilities until one choice remains. The tree chooses questions that best reduce uncertainty at each node. Leaves store final predictions. Humans like trees because their rules are explicit and auditable.

### How it actually works
At each node, choose feature and threshold that maximize impurity reduction (e.g., Gini or entropy for classification, variance reduction for regression). Stop by depth/min-samples constraints or purity. Pruning reduces overfitting by removing weak branches.

### Real-world examples
- Customer churn risk triage.
- Fraud rule extraction for transaction pipelines.
- Clinical triage support with explainable branches.

### Strategic benefits
- Handles nonlinear boundaries and feature interactions.
- Works with mixed numeric/categorical encodings (after preprocessing as needed).
- Interpretable path explanations.

### Limitations and failure modes
- High variance; small data changes can alter structure.
- Overfitting without depth/leaf constraints.
- Axis-aligned splits can be inefficient for some geometries.

### Code snippet (Python, runnable)
```python
from sklearn.datasets import load_wine
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report

X, y = load_wine(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

tree = DecisionTreeClassifier(max_depth=4, min_samples_leaf=4, random_state=42)
tree.fit(X_train, y_train)

pred = tree.predict(X_test)
print("Accuracy:", round(accuracy_score(y_test, pred), 4))
print(classification_report(y_test, pred, digits=3))
print("Tree depth:", tree.get_depth())
print("Leaves:", tree.get_n_leaves())
```

### Diagram description
Root node splitting on feature threshold, branching left/right until leaf nodes with class labels and sample counts.

### Self-check quiz
1. Main reason single trees overfit:
A) Too few features
B) Greedy deep splitting memorizes noise
C) Always linear
D) No train step

Answer: B
Explanation: Deep trees can model noise patterns in training data.

2. A typical split criterion for classification is:
A) Mean absolute error
B) Gini impurity
C) Cosine similarity
D) BLEU score

Answer: B
Explanation: Gini or entropy are standard classification split criteria.

3. Pruning is used to:
A) Increase tree depth
B) Remove weak branches to improve generalization
C) Add random noise
D) Convert to linear model

Answer: B
Explanation: Pruning reduces variance and improves out-of-sample performance.

---

## Sub-section: Random Forest

### Title and one-line definition
Random Forest is an ensemble of decision trees trained on bootstrapped samples with feature randomness.

### Intuition
Instead of trusting one expert, ask many experts who saw different subsets of evidence, then vote. Individual trees are noisy, but aggregated votes are stable. Diversity across trees is the key to better generalization.

### How it actually works
For each tree: sample training rows with replacement (bootstrap), choose random feature subsets at splits, grow tree, aggregate predictions across trees (majority vote/classification, average/regression). Variance decreases as tree count increases.

### Real-world examples
- Credit default probability ranking.
- Manufacturing defect detection from sensor arrays.
- Customer propensity scoring in marketing.

### Strategic benefits
- Strong baseline with minimal feature engineering.
- Robust to overfitting compared with single trees.
- Provides feature importance signals.

### Limitations and failure modes
- Less interpretable than a single tree.
- Larger memory and latency than compact linear models.
- Importance scores can be biased with correlated features.

### Code snippet (Python, runnable)
```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score, roc_auc_score

X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=7, stratify=y
)

rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=None,
    min_samples_leaf=2,
    random_state=7,
    n_jobs=-1,
)
rf.fit(X_train, y_train)

pred = rf.predict(X_test)
prob = rf.predict_proba(X_test)[:, 1]
print("F1:", round(f1_score(y_test, pred), 4))
print("ROC-AUC:", round(roc_auc_score(y_test, prob), 4))
print("Top importances:", sorted(rf.feature_importances_, reverse=True)[:5])
```

### Diagram description
Show multiple trees receiving bootstrapped datasets, then outputs merged by a voting/averaging block.

### Self-check quiz
1. Random Forest improves over a single tree mainly by reducing:
A) Bias only
B) Variance via ensembling
C) Data size
D) Label noise directly

Answer: B
Explanation: Bagging and random feature selection reduce variance.

2. Bootstrap sampling means:
A) Sampling without replacement
B) Sampling with replacement
C) Always balanced classes
D) Taking only minority class

Answer: B
Explanation: Each tree sees a resampled dataset with duplicates.

3. For classification, forest output is typically:
A) Sum of losses
B) Majority vote
C) Nearest centroid
D) Random class

Answer: B
Explanation: Trees vote and the majority class is selected.

---

## Sub-section: Support Vector Machines (SVM)

### Title and one-line definition
SVM finds the decision boundary with maximum margin between classes, optionally using kernels for nonlinearity.

### Intuition
Picture two groups of points with many possible separating lines. SVM picks the line that leaves the widest safety gap between groups. Only points near the boundary (support vectors) matter most. Wider margin usually means better robustness.

### How it actually works
Solve constrained optimization maximizing margin, equivalent to minimizing $\|w\|^2$ with classification constraints. Soft-margin parameter $C$ trades margin width vs training errors. Kernel trick maps inputs to high-dimensional feature spaces without explicit transformation.

### Real-world examples
- Text categorization with sparse TF-IDF vectors.
- Bioinformatics binary classification with moderate sample sizes.
- Fault detection where margin robustness is important.

### Strategic benefits
- Effective in high-dimensional spaces.
- Strong performance with clear margins and limited data.
- Flexible kernels for nonlinear boundaries.

### Limitations and failure modes
- Scaling to very large datasets can be expensive.
- Kernel and hyperparameter choice is sensitive.
- Probabilities require extra calibration.

### Code snippet (Python, runnable)
```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report

X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=21, stratify=y
)

svm = Pipeline([
    ("scaler", StandardScaler()),
    ("svc", SVC(C=2.0, kernel="rbf", gamma="scale")),
])
svm.fit(X_train, y_train)

pred = svm.predict(X_test)
print("Accuracy:", round(accuracy_score(y_test, pred), 4))
print(classification_report(y_test, pred, digits=3))
```

### Diagram description
Two classes with parallel margin lines around a separating hyperplane; highlight support vectors touching the margins.

### Self-check quiz
1. Support vectors are:
A) Random training points
B) Points far from boundary
C) Points near margin that define the boundary
D) Validation-only points

Answer: C
Explanation: They determine the optimal separating hyperplane.

2. Parameter C controls:
A) Number of classes
B) Margin-error tradeoff
C) Input dimensionality
D) Learning rate schedule

Answer: B
Explanation: Larger C penalizes errors more, often reducing margin.

3. Kernel trick enables:
A) Faster CSV loading
B) Nonlinear decision boundaries via implicit mapping
C) Class balancing
D) Model quantization

Answer: B
Explanation: Kernels compute inner products in transformed spaces efficiently.

---

## Sub-section: Naive Bayes

### Title and one-line definition
Naive Bayes is a probabilistic classifier that applies Bayes theorem with a conditional independence assumption.

### Intuition
It acts like combining independent clues: each word or feature gives evidence for each class, and the model multiplies that evidence. Even when independence is not perfectly true, this simple approach can work surprisingly well. It is fast and data-efficient for many text tasks.

### How it actually works
Compute posterior $P(y|x) \propto P(y)\prod_j P(x_j|y)$. Estimate priors and likelihoods from data with smoothing (e.g., Laplace) to avoid zero probabilities. Choose class with highest posterior probability.

### Real-world examples
- Email spam filtering.
- Intent classification for support ticket routing.
- News topic tagging from bag-of-words features.

### Strategic benefits
- Very fast train/infer even on large sparse vocabularies.
- Performs well with limited labeled data.
- Naturally probabilistic outputs.

### Limitations and failure modes
- Conditional independence rarely holds exactly.
- Weaker performance on complex feature interactions.
- Probability calibration may be poor.

### Code snippet (Python, runnable)
```python
from sklearn.datasets import fetch_20newsgroups
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import classification_report

categories = ["sci.space", "rec.sport.baseball", "talk.politics.misc"]
data = fetch_20newsgroups(subset="train", categories=categories, remove=("headers", "footers", "quotes"))
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=3, stratify=data.target
)

nb_pipe = Pipeline([
    ("tfidf", TfidfVectorizer(max_features=12000, ngram_range=(1, 2))),
    ("nb", MultinomialNB(alpha=0.5)),
])
nb_pipe.fit(X_train, y_train)

pred = nb_pipe.predict(X_test)
print(classification_report(y_test, pred, target_names=categories, digits=3))
```

### Diagram description
A class node points to independent feature likelihood nodes; posteriors computed by multiplying class prior and feature likelihoods.

### Self-check quiz
1. Naive Bayes assumes features are:
A) Causally linked
B) Conditionally independent given class
C) Uniformly distributed
D) Always numeric

Answer: B
Explanation: That is the key simplifying assumption.

2. Laplace smoothing is used to:
A) Remove all noise
B) Avoid zero likelihoods
C) Increase class count
D) Normalize labels

Answer: B
Explanation: It prevents unseen features from zeroing posterior probabilities.

3. A common strong domain for Naive Bayes is:
A) Computer vision segmentation
B) Sparse text classification
C) 3D rendering
D) Time-series control

Answer: B
Explanation: It works well with high-dimensional sparse text features.

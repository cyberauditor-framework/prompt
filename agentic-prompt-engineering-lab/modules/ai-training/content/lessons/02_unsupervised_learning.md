# Unsupervised Learning

**Title and one-line definition**
Unsupervised Learning discovers hidden structure in unlabeled data, such as clusters, latent factors, and association rules.

## Intuition
Imagine receiving millions of customer events without any tags. You can still group similar behaviors, identify recurring purchase patterns, and compress signals into simpler dimensions. Unsupervised learning is pattern mining without an answer key. It is often the first step before labeling, recommendation design, or anomaly detection.

## How it actually works
Given only inputs $X$, algorithms optimize structure objectives: clustering minimizes within-group distance; dimensionality reduction maximizes retained variance; association mining finds frequent co-occurrences with support/confidence constraints. Quality is validated with intrinsic metrics (silhouette, explained variance) or downstream utility (lift, conversion impact).

## Real-world examples
- Customer segmentation for targeted campaigns.
- Basket analysis for cross-sell bundle recommendations.
- Feature compression before downstream supervised modeling.

## Strategic benefits
- Works when labels are missing or expensive.
- Reveals data geometry and natural segments.
- Helps simplify high-dimensional datasets for faster pipelines.

## Limitations and failure modes
- Evaluation is less direct than supervised learning.
- Results can be sensitive to scaling and hyperparameters.
- Discovered patterns may be statistically strong but operationally irrelevant.

## Code snippet (Python, runnable)
```python
# Unsupervised clustering example with KMeans
from sklearn.datasets import load_wine
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

X, _ = load_wine(return_X_y=True)
X_scaled = StandardScaler().fit_transform(X)

kmeans = KMeans(n_clusters=3, n_init=20, random_state=42)
labels = kmeans.fit_predict(X_scaled)

score = silhouette_score(X_scaled, labels)
print("Cluster counts:", {c: int((labels == c).sum()) for c in set(labels)})
print("Silhouette score:", round(score, 4))
print("Inertia:", round(kmeans.inertia_, 2))
```

## Diagram description
Show unlabeled points entering three branches: Cluster Discovery, Rule Mining, and Dimensionality Reduction. Each branch outputs grouped segments, association rules, and compressed features.

## Self-check quiz
1. Unsupervised learning primarily requires:
A) Fully labeled targets
B) Pairwise labels only
C) Input data without labels
D) Reinforcement rewards

Answer: C
Explanation: It learns structure from unlabeled data.

2. A common intrinsic clustering metric is:
A) BLEU
B) Silhouette score
C) F1-score
D) Perplexity

Answer: B
Explanation: Silhouette measures cohesion and separation.

3. Main risk in unsupervised outputs:
A) Impossible to run in Python
B) Pattern significance may not equal business relevance
C) Needs GPU always
D) Cannot scale data

Answer: B
Explanation: Patterns can be mathematically valid but operationally weak.

---

## Sub-section: K-means

### Title and one-line definition
K-means partitions data into K clusters by minimizing distance from points to assigned centroids.

### Intuition
Place K magnets on a table of metal beads. Each bead sticks to the nearest magnet, then each magnet moves to the center of its assigned beads. Repeat until assignments stabilize. This iterative relocation forms compact groups.

### How it actually works
Initialize K centroids, assign each point to nearest centroid (usually Euclidean distance), recompute centroids as cluster means, iterate until centroid movement is small or assignments stop changing. Objective minimized is within-cluster sum of squares.

### Real-world examples
- Behavioral user segmentation.
- Store clustering by sales profiles.
- Grouping embeddings for content exploration.

### Strategic benefits
- Fast and scalable baseline.
- Easy to implement and explain.
- Useful for downstream personalization.

### Limitations and failure modes
- Must choose K in advance.
- Sensitive to initialization and outliers.
- Assumes roughly spherical, similarly sized clusters.

### Code snippet (Python, runnable)
```python
from sklearn.datasets import make_blobs
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

X, _ = make_blobs(n_samples=600, centers=4, cluster_std=1.1, random_state=12)

best_k = None
best_score = -1.0
for k in range(2, 7):
    model = KMeans(n_clusters=k, n_init=20, random_state=12)
    labels = model.fit_predict(X)
    score = silhouette_score(X, labels)
    if score > best_score:
        best_score = score
        best_k = k

final = KMeans(n_clusters=best_k, n_init=20, random_state=12)
labels = final.fit_predict(X)
print("Chosen K:", best_k)
print("Silhouette:", round(best_score, 4))
print("Centroids shape:", final.cluster_centers_.shape)
```

### Diagram description
Alternating two blocks: Assign to nearest centroid -> Recompute centroids, with loop arrow until convergence.

### Self-check quiz
1. K-means objective minimizes:
A) Classification error
B) Within-cluster squared distance
C) KL divergence only
D) Pairwise cosine margin

Answer: B
Explanation: It minimizes inertia (within-cluster sum of squares).

2. K-means is most sensitive to:
A) File format
B) Initialization and feature scaling
C) Python version only
D) Label encoding

Answer: B
Explanation: Bad initialization/scaling can distort clusters.

3. If clusters are non-spherical, K-means may:
A) Work perfectly always
B) Fail to capture true structure
C) Require labels
D) Become supervised

Answer: B
Explanation: Euclidean centroid assumptions can be mismatched.

---

## Sub-section: Apriori

### Title and one-line definition
Apriori mines frequent itemsets and association rules using the principle that all subsets of a frequent itemset must also be frequent.

### Intuition
If customers often buy bread and butter together, then bread alone and butter alone must also appear frequently. Apriori uses this downward-closure logic to prune impossible candidates early. That makes rule mining tractable.

### How it actually works
Generate candidate itemsets level-by-level: 1-itemsets, 2-itemsets, etc. Keep those above minimum support. From frequent itemsets, generate rules $A -> B$ and filter by confidence and lift. Prune candidates whose subsets are infrequent.

### Real-world examples
- Retail basket recommendations.
- Cross-sell bundles in ecommerce.
- Co-occurring symptom pattern analysis.

### Strategic benefits
- Produces interpretable if-then rules.
- Good for merchandising and recommendation design.
- Easy business communication of support/confidence/lift.

### Limitations and failure modes
- Candidate explosion with large item universes.
- Spurious rules without significance checks.
- Needs careful threshold tuning.

### Code snippet (Python, runnable)
```python
# Apriori with mlxtend
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import apriori, association_rules
import pandas as pd

transactions = [
    ["milk", "bread", "butter"],
    ["beer", "chips"],
    ["milk", "bread"],
    ["bread", "butter"],
    ["milk", "diapers", "beer", "bread"],
    ["milk", "diapers", "beer", "cola"],
]

te = TransactionEncoder()
arr = te.fit(transactions).transform(transactions)
df = pd.DataFrame(arr, columns=te.columns_)

freq = apriori(df, min_support=0.3, use_colnames=True)
rules = association_rules(freq, metric="confidence", min_threshold=0.6)

print(freq[["itemsets", "support"]])
print(rules[["antecedents", "consequents", "support", "confidence", "lift"]])
```

### Diagram description
Level-wise lattice of itemsets with infrequent branches crossed out; final rules displayed with support/confidence/lift badges.

### Self-check quiz
1. Apriori pruning relies on:
A) Gradient descent
B) Frequent itemset subset property
C) ROC optimization
D) Transformer attention

Answer: B
Explanation: Infrequent subsets imply infrequent supersets.

2. Lift greater than 1 suggests:
A) Negative association
B) Positive association beyond chance
C) No association
D) Invalid rule

Answer: B
Explanation: Lift > 1 indicates co-occurrence stronger than independence.

3. High confidence alone can be misleading because:
A) It ignores support and base rates
B) It requires labels
C) It cannot be computed
D) It is always 0

Answer: A
Explanation: Confidence can be high for very common consequents.

---

## Sub-section: PCA

### Title and one-line definition
Principal Component Analysis (PCA) projects data to orthogonal directions that capture maximum variance.

### Intuition
If a cloud of points is elongated, PCA rotates axes to align with the cloud's main directions. The first axis captures most variation, the second captures the next most under orthogonality, and so on. Keeping only top axes compresses data while preserving most information.

### How it actually works
Center features, compute covariance matrix, perform eigendecomposition or SVD, sort components by eigenvalues (explained variance), project data onto top-k eigenvectors. Standardization is essential when feature scales differ.

### Real-world examples
- Dimensionality reduction before clustering.
- Noise filtering in sensor pipelines.
- Visualizing high-dimensional embeddings in 2D/3D.

### Strategic benefits
- Reduces feature dimensionality and compute cost.
- Mitigates multicollinearity for downstream models.
- Enables compact visualization.

### Limitations and failure modes
- Components may be hard to interpret.
- Linear projection misses nonlinear structure.
- Sensitive to outliers and scaling choices.

### Code snippet (Python, runnable)
```python
from sklearn.datasets import load_wine
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import numpy as np

X, _ = load_wine(return_X_y=True)
X_scaled = StandardScaler().fit_transform(X)

pca = PCA(n_components=0.95, svd_solver="full")
X_reduced = pca.fit_transform(X_scaled)

print("Original shape:", X_scaled.shape)
print("Reduced shape:", X_reduced.shape)
print("Explained variance ratio (first 5):", np.round(pca.explained_variance_ratio_[:5], 4))
print("Total explained variance:", round(pca.explained_variance_ratio_.sum(), 4))
```

### Diagram description
Original high-dimensional feature space enters PCA block; outputs ordered principal components with a bar chart of explained variance.

### Self-check quiz
1. PCA components are:
A) Random basis vectors
B) Orthogonal directions maximizing variance
C) Class prototypes
D) Rule antecedents

Answer: B
Explanation: PCA chooses orthogonal directions by descending variance.

2. Before PCA, a common preprocessing step is:
A) Label smoothing
B) Feature standardization
C) Tokenization
D) Drop all correlated features

Answer: B
Explanation: Scale differences can dominate component extraction.

3. PCA is primarily:
A) A supervised classifier
B) An unsupervised dimensionality reduction method
C) A reinforcement optimizer
D) A text generator

Answer: B
Explanation: It learns latent structure without target labels.

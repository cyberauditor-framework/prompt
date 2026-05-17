# Self-Supervised Learning

**Title and one-line definition**
Self-Supervised Learning creates supervision signals from raw data itself to learn transferable representations without manual labels.

## Intuition
Instead of paying annotators, you design a pretext task from the data: predict missing words, masked image patches, or future segments. The model learns structure because solving the pretext requires understanding semantics. These pretrained representations are then fine-tuned on smaller labeled datasets. This is the engine behind modern foundation models.

## How it actually works
Define a surrogate objective such as masked modeling, contrastive learning, or next-step prediction. Train an encoder to minimize that objective on large unlabeled corpora. Then adapt encoder weights to downstream tasks via fine-tuning or linear probing. Contrastive methods maximize similarity for positive pairs and minimize it for negatives.

## Real-world examples
- BERT-style pretraining for NLP.
- Vision transformers pretrained with masked image modeling.
- Audio representation learning for speech and event detection.

## Strategic benefits
- Scales with abundant unlabeled data.
- Produces robust features transferable across tasks.
- Reduces labeled data requirements for downstream fine-tuning.

## Limitations and failure modes
- Pretext task may not align with downstream objectives.
- Large compute cost for pretraining at scale.
- Representation quality can degrade with poor augmentation design.

## Code snippet (Python, runnable)
```python
# Tiny self-supervised contrastive step in PyTorch
import torch
import torch.nn as nn
import torch.nn.functional as F

class Encoder(nn.Module):
    def __init__(self, dim_in=32, dim_h=64, dim_out=32):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(dim_in, dim_h), nn.ReLU(),
            nn.Linear(dim_h, dim_out)
        )
    def forward(self, x):
        return F.normalize(self.net(x), dim=-1)

batch, dim = 128, 32
x = torch.randn(batch, dim)
aug1 = x + 0.05 * torch.randn_like(x)
aug2 = x + 0.05 * torch.randn_like(x)

enc = Encoder(dim_in=dim)
z1, z2 = enc(aug1), enc(aug2)

# InfoNCE-style similarity matrix
logits = z1 @ z2.T / 0.1
labels = torch.arange(batch)
loss = F.cross_entropy(logits, labels)

loss.backward()
print("Contrastive pretext loss:", round(loss.item(), 6))
```

## Diagram description
Raw data -> augmentation/pretext generator -> shared encoder -> pretext loss optimization -> transferable embedding block used for downstream tasks.

## Self-check quiz
1. Self-supervised learning differs from semi-supervised because it:
A) Uses no objective
B) Derives labels from data transformations/pretext tasks
C) Requires only human labels
D) Is identical to clustering

Answer: B
Explanation: Targets are created automatically from data structure.

2. A common self-supervised objective is:
A) K-means inertia
B) Contrastive loss or masked prediction loss
C) Decision tree impurity
D) Rule confidence

Answer: B
Explanation: These objectives drive representation learning.

3. Main downstream use of self-supervised pretraining:
A) Replace all deployment metrics
B) Initialize encoders for fine-tuning with fewer labels
C) Avoid data preprocessing forever
D) Remove model monitoring

Answer: B
Explanation: Transfer learning from pretrained representations is the main benefit.

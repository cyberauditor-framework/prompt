# Workflow Step 4: Training

**Title and one-line definition**
Training fits model parameters on prepared data using optimization procedures while controlling generalization and stability.

## Intuition
Training is controlled optimization, not brute-force fitting. You want the model to learn underlying patterns, not memorize noise. Good training practices include proper batching, regularization, early stopping, and reproducible experiment tracking.

## How it actually works
Initialize model, choose optimizer and learning-rate schedule, iterate minibatches to minimize training loss, and monitor validation metrics. Apply regularization (weight decay, dropout, augmentation) and checkpoints. Stop based on validation plateau or overfitting signals.

## Real-world examples
- Daily retraining of demand forecasting models.
- Scheduled fine-tuning of recommendation rankers.
- MLOps pipelines with tracked model versions.

## Strategic benefits
- Stable convergence and reproducibility.
- Better generalization with disciplined regularization.
- Enables rollback and governance through checkpointing.

## Limitations and failure modes
- Overfitting from excessive epochs.
- Underfitting from weak capacity or poor features.
- Non-determinism without seed and environment controls.

## Code snippet (Python, runnable)
```python
# Basic supervised training loop in PyTorch
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader

X = torch.randn(1024, 20)
true_w = torch.randn(20, 1)
y = (X @ true_w + 0.1 * torch.randn(1024, 1) > 0).long().squeeze()

loader = DataLoader(TensorDataset(X, y), batch_size=64, shuffle=True)
model = nn.Sequential(nn.Linear(20, 64), nn.ReLU(), nn.Linear(64, 2))
opt = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)
loss_fn = nn.CrossEntropyLoss()

for epoch in range(6):
    total = 0.0
    for xb, yb in loader:
        logits = model(xb)
        loss = loss_fn(logits, yb)
        opt.zero_grad(); loss.backward(); opt.step()
        total += loss.item() * xb.size(0)
    print(f"epoch={epoch+1} loss={total/len(loader.dataset):.4f}")

with torch.no_grad():
    pred = model(X).argmax(dim=1)
    acc = (pred == y).float().mean().item()
print("Train accuracy:", round(acc, 4))
```

## Diagram description
Epoch loop with minibatches: forward pass -> loss -> backward pass -> optimizer step -> validation checkpoint.

## Self-check quiz
1. Early stopping primarily helps prevent:
A) Underflow only
B) Overfitting to training data
C) Data ingestion issues
D) Feature scaling mismatch

Answer: B
Explanation: It halts training when validation no longer improves.

2. Weight decay is a form of:
A) Data augmentation
B) Regularization
C) Label encoding
D) Deployment monitoring

Answer: B
Explanation: It penalizes large weights to improve generalization.

3. Reproducible training requires:
A) Ignoring random seeds
B) Tracking seeds, configs, and environment versions
C) Only saving final metrics
D) No checkpointing

Answer: B
Explanation: Reproducibility depends on controlled and logged setup.

# Model Pruning

**Title and one-line definition**
Model Pruning removes less important parameters or structures to reduce model size and inference cost.

## Intuition
Not all model weights contribute equally. Many parameters have near-zero impact and can be removed with little accuracy loss. Pruning is like trimming redundant branches from a tree while preserving fruit-bearing limbs. The result is a lighter model that is easier to deploy.

## How it actually works
Apply unstructured pruning (weight-level sparsity) or structured pruning (channels/heads/filters). Criteria include magnitude, gradient sensitivity, or saliency. Typical workflow: prune -> fine-tune -> evaluate. Structured pruning usually yields better hardware speedups than unstructured sparsity on standard devices.

## Real-world examples
- Edge deployment of vision models on mobile CPUs.
- Lower-cost inference for high-QPS API endpoints.
- On-device NLP assistants with strict memory budgets.

## Strategic benefits
- 20 to 60 percent parameter reduction is common with modest tuning.
- Can reduce latency and memory footprint.
- Enables deployment on constrained hardware.

## Limitations and failure modes
- Aggressive pruning can degrade accuracy sharply.
- Unstructured sparsity may not translate to wall-clock speedup.
- Requires post-pruning fine-tuning and benchmark validation.

## Code snippet (Python, runnable)
```python
# Unstructured pruning with PyTorch utilities
import torch
import torch.nn as nn
import torch.nn.utils.prune as prune

model = nn.Sequential(
    nn.Linear(64, 128), nn.ReLU(),
    nn.Linear(128, 64), nn.ReLU(),
    nn.Linear(64, 10)
)

# Prune 40% of weights in first and second linear layers
prune.l1_unstructured(model[0], name="weight", amount=0.4)
prune.l1_unstructured(model[2], name="weight", amount=0.4)

x = torch.randn(32, 64)
y = torch.randint(0, 10, (32,))
logits = model(x)
loss = nn.CrossEntropyLoss()(logits, y)
loss.backward()

# Compute sparsity
w0 = model[0].weight
sparsity = float((w0 == 0).sum().item()) / w0.numel()
print("Layer0 sparsity:", round(sparsity, 4))
print("Loss:", round(loss.item(), 6))
```

## Diagram description
Full dense model -> pruning mask application -> sparse/trimmed model -> fine-tuning block -> deployment profile comparison.

## Self-check quiz
1. Structured pruning generally helps latency more than unstructured because:
A) It removes random bits only
B) It removes whole channels/units that hardware libraries exploit
C) It avoids retraining
D) It increases FLOPs

Answer: B
Explanation: Hardware kernels handle structured reductions better.

2. Typical pruning workflow includes:
A) Prune and deploy immediately without checks
B) Prune, fine-tune, then validate
C) Only quantize
D) Only distill

Answer: B
Explanation: Fine-tuning recovers performance after pruning.

3. Main pruning risk:
A) Too little model compression
B) Accuracy collapse from over-pruning
C) Mandatory distributed training
D) No monitoring needed

Answer: B
Explanation: Excessive removal can destroy critical capacity.

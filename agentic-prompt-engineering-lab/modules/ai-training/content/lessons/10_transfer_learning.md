# Transfer Learning

**Title and one-line definition**
Transfer Learning reuses knowledge from a pretrained model on a source task to accelerate learning on a target task.

## Intuition
If a model already learned broad visual or linguistic patterns, you should not start from random weights. Transfer learning is like hiring a specialist and giving a short onboarding for your domain. You keep general skills and adapt only what is task-specific. This cuts data and training requirements dramatically.

## How it actually works
Load pretrained backbone weights, replace task head, then fine-tune all or some layers. Common strategies: feature extraction (freeze backbone) or full fine-tuning (unfreeze gradually with lower LR). Objective remains target-task loss, but initialization is informative rather than random.

## Real-world examples
- Medical imaging classification using ImageNet-pretrained CNNs.
- Domain sentiment analysis from pretrained language encoders.
- Defect detection in specialized manufacturing imagery.

## Strategic benefits
- Faster convergence and lower compute spend.
- Better results on small target datasets.
- Lower annotation burden for niche tasks.

## Limitations and failure modes
- Negative transfer when source and target domains are far apart.
- Catastrophic forgetting with aggressive fine-tuning.
- Licensing and provenance constraints for pretrained checkpoints.

## Code snippet (Python, runnable)
```python
# Transfer learning example with torchvision ResNet18
import torch
import torch.nn as nn
from torchvision.models import resnet18, ResNet18_Weights

num_classes = 5
model = resnet18(weights=ResNet18_Weights.DEFAULT)

# Freeze backbone
for p in model.parameters():
    p.requires_grad = False

# Replace classification head
in_features = model.fc.in_features
model.fc = nn.Linear(in_features, num_classes)

# Only train head parameters
trainable = [p for p in model.parameters() if p.requires_grad]
optimizer = torch.optim.Adam(trainable, lr=1e-3)
loss_fn = nn.CrossEntropyLoss()

x = torch.randn(16, 3, 224, 224)
y = torch.randint(0, num_classes, (16,))
logits = model(x)
loss = loss_fn(logits, y)
optimizer.zero_grad(); loss.backward(); optimizer.step()
print("Transfer step loss:", round(loss.item(), 6))
```

## Diagram description
Pretrained backbone block feeding new task head; first stage with frozen backbone, second stage optional selective unfreezing.

## Self-check quiz
1. Transfer learning is most helpful when:
A) Target data is tiny and pretrained model is relevant
B) No source model exists
C) Labels are perfect and abundant always
D) Training cost is irrelevant

Answer: A
Explanation: Reusing relevant learned features helps low-data settings.

2. Feature extraction strategy means:
A) Train all layers from scratch
B) Freeze backbone and train new head
C) Remove output head entirely
D) Use no optimizer

Answer: B
Explanation: The pretrained feature extractor remains fixed.

3. Negative transfer occurs when:
A) Source-target domains mismatch strongly
B) Learning rate is zero
C) Dataset is shuffled
D) Batch size is small

Answer: A
Explanation: Irrelevant source features can hurt target performance.

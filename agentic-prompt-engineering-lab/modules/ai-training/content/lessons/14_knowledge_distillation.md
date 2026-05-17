# Knowledge Distillation (Teacher-Student Framework)

**Title and one-line definition**
Knowledge Distillation trains a smaller student model to mimic a larger teacher model's behavior.

## Intuition
A strong teacher model captures nuanced decision boundaries but may be too expensive for production. Distillation transfers this knowledge to a compact student by training on soft probability targets, not just hard labels. Soft targets expose class similarities that hard labels hide. The student often reaches strong performance with much lower latency.

## How it actually works
Teacher generates logits/probabilities on training inputs. Student minimizes a combined loss: hard-label cross-entropy plus softened KL divergence between teacher and student outputs at temperature $T$. Loss: $L=\alpha L_{hard} + (1-\alpha)T^2 KL(p_t^T||p_s^T)$.

## Real-world examples
- Distilling large LLM rerankers into fast API models.
- Compressing speech models for edge devices.
- Deploying lightweight moderation classifiers from larger teacher systems.

## Strategic benefits
- Significant latency and memory reduction with limited quality loss.
- Better student calibration than training from scratch in many cases.
- Practical path for cost-sensitive production serving.

## Limitations and failure modes
- Student capacity ceiling may prevent full teacher transfer.
- Distillation data quality and coverage are critical.
- Teacher biases can be inherited by student.

## Code snippet (Python, runnable)
```python
# Distillation loss demo in PyTorch
import torch
import torch.nn as nn
import torch.nn.functional as F

batch, classes = 32, 6
teacher_logits = torch.randn(batch, classes) * 1.5
student_logits = torch.randn(batch, classes, requires_grad=True)
labels = torch.randint(0, classes, (batch,))

T = 2.5
alpha = 0.4

hard_loss = nn.CrossEntropyLoss()(student_logits, labels)
teacher_soft = F.softmax(teacher_logits / T, dim=1)
student_log_soft = F.log_softmax(student_logits / T, dim=1)
soft_loss = F.kl_div(student_log_soft, teacher_soft, reduction="batchmean") * (T * T)

loss = alpha * hard_loss + (1 - alpha) * soft_loss
loss.backward()

print("Hard loss:", round(hard_loss.item(), 6))
print("Soft distill loss:", round(soft_loss.item(), 6))
print("Total loss:", round(loss.item(), 6))
```

## Diagram description
Large teacher and labeled data feed soft targets; student receives both hard labels and soft targets; deployment arrow points to low-latency student.

## Self-check quiz
1. Distillation soft targets are useful because they:
A) Remove class information
B) Encode inter-class similarity structure
C) Replace all labels always
D) Require no teacher model

Answer: B
Explanation: Soft probabilities convey richer supervision signal.

2. Temperature in distillation is used to:
A) Change batch size
B) Soften probability distributions
C) Select optimizer
D) Normalize features

Answer: B
Explanation: Higher temperature produces smoother class probabilities.

3. Typical distillation goal is:
A) Increase model size
B) Preserve teacher quality in a smaller/faster student
C) Eliminate validation
D) Avoid deployment monitoring

Answer: B
Explanation: Student aims for strong quality-cost tradeoff.

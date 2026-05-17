# Quantization (Post-Training and Quantization-Aware Training)

**Title and one-line definition**
Quantization reduces numeric precision (e.g., FP32 to INT8) to shrink models and speed inference.

## Intuition
Most models do not need 32-bit precision for every multiply. By representing weights and activations with fewer bits, we reduce memory bandwidth and arithmetic cost. Post-training quantization is quick and simple; quantization-aware training (QAT) simulates quantization during training to preserve accuracy.

## How it actually works
Post-training quantization calibrates scales/zero-points from representative data and converts tensors to lower precision. QAT inserts fake-quantization ops during training so the model learns robustness to quantization noise. Inference runtime executes integer kernels where supported.

## Real-world examples
- Mobile vision apps requiring real-time latency.
- CPU-only model serving to cut cloud cost.
- Embedded speech wake-word detection.

## Strategic benefits
- Often 2x to 4x smaller models in INT8 vs FP32.
- Can deliver 1.5x to 4x latency gains depending on hardware.
- Reduces memory footprint and power usage.

## Limitations and failure modes
- Accuracy drop on sensitive layers/tasks.
- Hardware/runtime support differences across platforms.
- Poor calibration data can hurt PTQ outcomes.

## Code snippet (Python, runnable)
```python
# Dynamic quantization example in PyTorch (CPU)
import torch
import torch.nn as nn

class SmallMLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(128, 256), nn.ReLU(),
            nn.Linear(256, 64), nn.ReLU(),
            nn.Linear(64, 10)
        )
    def forward(self, x):
        return self.net(x)

fp32_model = SmallMLP().eval()
q_model = torch.quantization.quantize_dynamic(
    fp32_model, {nn.Linear}, dtype=torch.qint8
)

x = torch.randn(32, 128)
with torch.no_grad():
    y_fp = fp32_model(x)
    y_q = q_model(x)

max_abs_diff = (y_fp - y_q).abs().max().item()
print("FP32 shape:", tuple(y_fp.shape), "INT8 shape:", tuple(y_q.shape))
print("Max abs output diff:", round(max_abs_diff, 6))
```

## Diagram description
FP32 model and calibration data enter quantizer; output INT8 model deployed to edge/CPU with latency and memory KPI indicators.

## Self-check quiz
1. PTQ stands for:
A) Pre-training query tuning
B) Post-training quantization
C) Parallel task queue
D) Probabilistic transfer quality

Answer: B
Explanation: PTQ applies quantization after full-precision training.

2. QAT differs from PTQ because QAT:
A) Uses no training
B) Simulates quantization noise during training
C) Requires no runtime support
D) Always produces zero loss

Answer: B
Explanation: QAT adapts model weights under quantized constraints.

3. Quantization gains depend strongly on:
A) Developer timezone
B) Hardware and kernel support
C) File naming
D) Comment style

Answer: B
Explanation: Actual speedups require compatible low-precision kernels.

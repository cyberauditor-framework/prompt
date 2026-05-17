# Transformers and the Attention Mechanism

**Title and one-line definition**
Transformers use attention to model token relationships directly, enabling scalable parallel training and long-context sequence modeling.

## Intuition
Instead of reading strictly left-to-right with a single hidden summary, attention lets each token look at all relevant tokens and decide what matters. This captures long-range dependencies more effectively. Stacking attention layers builds rich contextual representations. This architecture powers modern LLMs such as GPT and Claude.

## How it actually works
For each token representation, attention computes queries, keys, and values. Weights are $\text{softmax}(QK^T/\sqrt{d_k})$, then used to mix value vectors. Multi-head attention learns different relation subspaces in parallel. Position encodings preserve order information. Decoder-only transformers (e.g., GPT-style) use causal masking for autoregressive generation.

## Real-world examples
- LLM chat assistants and coding copilots.
- Document summarization and retrieval-augmented QA.
- Multimodal captioning and translation.

## Strategic benefits
- Strong long-context modeling compared to RNNs.
- High training parallelism on modern hardware.
- Scales predictably with data and parameters.

## Limitations and failure modes
- Quadratic attention cost in sequence length.
- Hallucination and calibration issues in generation.
- Expensive pretraining and inference at large scales.

## Code snippet (Python, runnable)
```python
# Tiny transformer encoder pass in PyTorch
import torch
import torch.nn as nn

vocab_size = 1000
seq_len = 24
batch = 16
embed_dim = 64

embedding = nn.Embedding(vocab_size, embed_dim)
encoder_layer = nn.TransformerEncoderLayer(
    d_model=embed_dim, nhead=8, dim_feedforward=128, batch_first=True
)
encoder = nn.TransformerEncoder(encoder_layer, num_layers=2)
classifier = nn.Linear(embed_dim, 4)

x = torch.randint(0, vocab_size, (batch, seq_len))
y = torch.randint(0, 4, (batch,))

h = embedding(x)
z = encoder(h)
pooled = z.mean(dim=1)
logits = classifier(pooled)

loss = nn.CrossEntropyLoss()(logits, y)
loss.backward()
print("Batch logits shape:", tuple(logits.shape))
print("Loss:", round(loss.item(), 6))
```

## Diagram description
Token embeddings -> multi-head self-attention -> feedforward block (with residual + norm) repeated N times -> decoder head for logits.

## Self-check quiz
1. Self-attention computes token mixing weights from:
A) CNN kernels only
B) Query-key similarity
C) Rule mining support
D) Tree impurity

Answer: B
Explanation: Attention weights come from scaled dot-product similarity.

2. GPT-style models are primarily:
A) Encoder-only masked models
B) Decoder-only autoregressive transformers
C) Tree ensembles
D) Graph-only models

Answer: B
Explanation: GPT uses causal decoder blocks for next-token prediction.

3. One major transformer bottleneck is:
A) No GPU support
B) Quadratic memory/time with context length in full attention
C) Cannot process text
D) No transfer learning

Answer: B
Explanation: Standard dense attention scales as $O(n^2)$.

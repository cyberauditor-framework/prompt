# Recurrent Neural Networks (RNNs) and LSTM

**Title and one-line definition**
RNNs model sequential dependencies by carrying hidden state through time; LSTMs improve long-range memory with gated mechanisms.

## Intuition
Sequence tasks need memory: the meaning of a word depends on previous words, and sensor forecasts depend on prior readings. Vanilla RNNs repeatedly update a hidden summary but can forget distant context. LSTMs add gates that decide what to store, forget, and expose, which preserves useful long-term signals.

## How it actually works
At time step $t$, RNN computes $h_t=f(W_x x_t + W_h h_{t-1})$. LSTM introduces cell state $c_t$ and gates (input, forget, output) using sigmoid activations to control information flow. Training uses backpropagation through time (BPTT), which can suffer from exploding/vanishing gradients in plain RNNs.

## Real-world examples
- Time-series forecasting for demand and load.
- Speech recognition and keyword spotting.
- Sequence labeling (NER, POS tagging) in NLP baselines.

## Strategic benefits
- Naturally handles variable-length sequential inputs.
- LSTM improves robustness for longer dependencies.
- Useful in low-resource settings where transformers are too heavy.

## Limitations and failure modes
- Sequential computation limits parallelism.
- Long contexts still challenging vs transformer attention.
- Sensitive to sequence preprocessing and truncation windows.

## Code snippet (Python, runnable)
```python
# Sequence classification with PyTorch LSTM
import torch
import torch.nn as nn

class LSTMClassifier(nn.Module):
    def __init__(self, input_dim=8, hidden_dim=32, num_classes=3):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, num_classes)

    def forward(self, x):
        out, _ = self.lstm(x)
        last = out[:, -1, :]
        return self.fc(last)

batch, seq_len, input_dim = 64, 20, 8
x = torch.randn(batch, seq_len, input_dim)
y = torch.randint(0, 3, (batch,))

model = LSTMClassifier(input_dim=input_dim)
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
loss_fn = nn.CrossEntropyLoss()

for _ in range(10):
    logits = model(x)
    loss = loss_fn(logits, y)
    opt.zero_grad(); loss.backward(); opt.step()

pred = model(x).argmax(dim=1)
acc = (pred == y).float().mean().item()
print("Train loss:", round(loss.item(), 4), "Train acc:", round(acc, 4))
```

## Diagram description
Unrolled sequence of timesteps with hidden-state arrows; LSTM cell includes forget/input/output gates controlling cell state path.

## Self-check quiz
1. LSTM improves over vanilla RNN mainly by:
A) Removing recurrence
B) Gated memory control
C) Using no hidden state
D) Ignoring sequence order

Answer: B
Explanation: Gates stabilize learning over long dependencies.

2. BPTT stands for:
A) Bayesian parameter test tuning
B) Backpropagation through time
C) Balanced probability transfer
D) Batch pooling transfer

Answer: B
Explanation: Gradients are propagated across sequence timesteps.

3. A key RNN limitation vs transformers is:
A) Too much parallelism
B) Sequential computation bottleneck
C) Inability to use embeddings
D) No optimizer support

Answer: B
Explanation: Time-step recurrence reduces training parallelism.

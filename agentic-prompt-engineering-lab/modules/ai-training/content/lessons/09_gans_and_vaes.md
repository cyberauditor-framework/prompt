# GANs and VAEs

**Title and one-line definition**
GANs and VAEs are generative deep learning families: GANs learn via adversarial game dynamics, while VAEs learn probabilistic latent-variable models.

## Intuition
Both methods try to generate realistic new samples, but through different philosophies. GANs pit a generator against a discriminator, like a forger versus inspector. VAEs instead learn a smooth latent space where nearby points decode to similar outputs. GANs often produce sharper samples; VAEs often provide more stable training and better latent structure.

## How it actually works
GAN objective is a minimax game between generator $G(z)$ and discriminator $D(x)$, optimizing adversarial losses. VAE optimizes ELBO: reconstruction likelihood plus KL divergence regularization between approximate posterior and prior. Both use stochastic gradient optimization with minibatches.

## Real-world examples
- Synthetic image generation for data augmentation.
- Anomaly detection via reconstruction errors (VAE).
- Creative media synthesis and style transfer pipelines.

## Strategic benefits
- Enable simulation and synthetic data expansion.
- VAEs provide controllable latent spaces.
- GANs can produce high-fidelity samples for vision tasks.

## Limitations and failure modes
- GANs can suffer mode collapse and unstable training.
- VAEs may produce blurrier outputs with simple decoders.
- Generated outputs can encode training-set bias.

## Code snippet (Python, runnable)
```python
# Minimal VAE forward/loss step in PyTorch
import torch
import torch.nn as nn
import torch.nn.functional as F

class VAE(nn.Module):
    def __init__(self, in_dim=20, latent_dim=4):
        super().__init__()
        self.enc = nn.Sequential(nn.Linear(in_dim, 32), nn.ReLU())
        self.mu = nn.Linear(32, latent_dim)
        self.logvar = nn.Linear(32, latent_dim)
        self.dec = nn.Sequential(nn.Linear(latent_dim, 32), nn.ReLU(), nn.Linear(32, in_dim))

    def forward(self, x):
        h = self.enc(x)
        mu, logvar = self.mu(h), self.logvar(h)
        std = torch.exp(0.5 * logvar)
        z = mu + std * torch.randn_like(std)
        x_hat = self.dec(z)
        return x_hat, mu, logvar

x = torch.randn(64, 20)
vae = VAE(in_dim=20, latent_dim=4)
x_hat, mu, logvar = vae(x)
recon = F.mse_loss(x_hat, x, reduction="mean")
kl = -0.5 * torch.mean(1 + logvar - mu.pow(2) - logvar.exp())
loss = recon + 0.1 * kl
loss.backward()
print("Recon:", round(recon.item(), 6), "KL:", round(kl.item(), 6), "Total:", round(loss.item(), 6))
```

## Diagram description
Split panel: left GAN game (Generator -> Fake samples -> Discriminator vs real samples), right VAE pipeline (Encoder -> latent distribution -> sample z -> Decoder).

## Self-check quiz
1. GAN training involves:
A) Single model minimizing MSE only
B) Generator-discriminator adversarial optimization
C) Decision tree pruning
D) K-means assignment

Answer: B
Explanation: GANs train two competing networks.

2. VAE objective includes:
A) Only adversarial loss
B) Reconstruction loss + KL regularization
C) Hinge loss only
D) Reward function only

Answer: B
Explanation: ELBO combines both terms.

3. A classic GAN failure mode is:
A) Label leakage
B) Mode collapse
C) Confusion matrix drift
D) Tokenization mismatch

Answer: B
Explanation: Generator may produce limited output diversity.

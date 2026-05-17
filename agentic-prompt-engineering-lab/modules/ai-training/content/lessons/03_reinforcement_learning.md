# Reinforcement Learning

**Title and one-line definition**
Reinforcement Learning (RL) trains an agent to maximize long-term cumulative reward by interacting with an environment.

## Intuition
Think of teaching a robot by trial and feedback, not by labeled correct actions. The robot explores actions, receives rewards or penalties, and gradually prefers action sequences that lead to better outcomes. Crucially, good RL decisions optimize future return, not only immediate gain. This makes RL powerful for sequential control problems.

## How it actually works
RL is typically framed as a Markov Decision Process $(S, A, P, R, \gamma)$. Agent observes state $s_t$, chooses action $a_t$, gets reward $r_t$, transitions to $s_{t+1}$. Objective is maximizing expected discounted return $G_t=\sum_{k=0}^{\infty}\gamma^k r_{t+k+1}$. Core families include value-based methods (Q-learning), policy-gradient methods, and actor-critic variants (e.g., PPO).

## Real-world examples
- Dynamic ad bidding and budget pacing.
- Robotics control for grasping and locomotion.
- Datacenter and energy optimization.

## Strategic benefits
- Optimizes long-horizon objectives with delayed outcomes.
- Learns adaptive policies under changing dynamics.
- Useful when explicit labels are unavailable but rewards are measurable.

## Limitations and failure modes
- Sample inefficiency and large compute requirements.
- Reward misspecification can produce harmful behavior.
- Exploration in real systems can be costly or unsafe.

## Code snippet (Python, runnable)
```python
# Tabular RL baseline with Gymnasium FrozenLake
import gymnasium as gym
import numpy as np

env = gym.make("FrozenLake-v1", is_slippery=False)
q = np.zeros((env.observation_space.n, env.action_space.n), dtype=np.float64)

alpha = 0.1      # learning rate
gamma = 0.99     # discount
epsilon = 1.0    # exploration

for episode in range(3000):
    state, _ = env.reset(seed=episode)
    done = False
    while not done:
        if np.random.rand() < epsilon:
            action = env.action_space.sample()
        else:
            action = int(np.argmax(q[state]))

        next_state, reward, terminated, truncated, _ = env.step(action)
        done = terminated or truncated

        td_target = reward + gamma * np.max(q[next_state]) * (0 if done else 1)
        q[state, action] += alpha * (td_target - q[state, action])
        state = next_state

    epsilon = max(0.05, epsilon * 0.999)

print("Learned policy:", np.argmax(q, axis=1))
print("Q-table sample:\n", np.round(q[:4], 3))
```

## Diagram description
Environment-agent loop: State -> Agent Policy -> Action -> Environment -> Reward + Next State, with replay/updates feeding back into policy/value network.

## Self-check quiz
1. RL optimizes:
A) Immediate reward only
B) Cumulative discounted return
C) Label reconstruction error
D) Cluster compactness

Answer: B
Explanation: RL maximizes expected long-term return.

2. A key RL challenge is:
A) No need for metrics
B) Exploration vs exploitation tradeoff
C) Mandatory labels
D) Fixed one-step data only

Answer: B
Explanation: Agent must balance trying new actions and using known good ones.

3. Reward misspecification can cause:
A) Guaranteed robustness
B) Reward hacking and unintended behavior
C) Faster convergence always
D) Deterministic perfect policy

Answer: B
Explanation: The agent optimizes what is rewarded, not what designers intended.

---

## Sub-section: Q-Learning

### Title and one-line definition
Q-Learning is an off-policy value-based algorithm that learns action values for each state-action pair.

### Intuition
Maintain a score table for "how good is action a in state s". After each action, adjust the score toward observed reward plus best future estimate. Over many episodes, the table converges to near-optimal values in small discrete problems.

### How it actually works
Update rule: $Q(s,a) \leftarrow Q(s,a)+\alpha[r+\gamma\max_{a'}Q(s',a')-Q(s,a)]$. Off-policy means it can learn greedy target values while following an exploratory behavior policy (epsilon-greedy).

### Real-world examples
- Game grid navigation.
- Elevator dispatch simulation.
- Inventory reorder policy in small state spaces.

### Strategic benefits
- Simple, interpretable baseline.
- Converges under standard assumptions.
- No model of transition dynamics required.

### Limitations and failure modes
- Does not scale to large/continuous states.
- Requires discretization for many real tasks.
- Can learn slowly with sparse rewards.

### Code snippet (Python, runnable)
```python
import gymnasium as gym
import numpy as np

env = gym.make("Taxi-v3")
q = np.zeros((env.observation_space.n, env.action_space.n), dtype=np.float64)
alpha, gamma, epsilon = 0.2, 0.95, 1.0

for ep in range(2500):
    s, _ = env.reset(seed=ep)
    done = False
    while not done:
        a = env.action_space.sample() if np.random.rand() < epsilon else int(np.argmax(q[s]))
        s2, r, term, trunc, _ = env.step(a)
        done = term or trunc
        target = r + gamma * np.max(q[s2]) * (0 if done else 1)
        q[s, a] += alpha * (target - q[s, a])
        s = s2
    epsilon = max(0.05, epsilon * 0.997)

policy = np.argmax(q, axis=1)
print("Policy states:", policy[:20])
print("Mean Q:", round(float(q.mean()), 4))
```

### Diagram description
State-action table updated by TD target using immediate reward plus max next-state action value.

### Self-check quiz
1. Q-Learning is:
A) On-policy only
B) Off-policy TD control
C) Supervised regression
D) Bayesian optimization

Answer: B
Explanation: It learns target greedy values while behavior can explore.

2. Core target term includes:
A) min next Q
B) max next Q
C) median next Q
D) no future term

Answer: B
Explanation: Bellman optimality uses max over next actions.

3. Q-Learning scales poorly when:
A) State-action space is very large
B) Data is normalized
C) Rewards are dense
D) Episodes are short

Answer: A
Explanation: Tabular representation becomes infeasible.

---

## Sub-section: Deep Q Networks (DQN)

### Title and one-line definition
DQN approximates Q-values with a neural network, enabling value-based RL on high-dimensional observations.

### Intuition
Replace the Q-table with a neural network that predicts Q-values from raw states. To stabilize learning, replay old experiences and train against a slowly updated target network. This reduces the feedback instability of online bootstrapping.

### How it actually works
Parameterize $Q(s,a;\theta)$, minimize TD loss from sampled replay mini-batches: $(r+\gamma\max_{a'}Q(s',a';\theta^-) - Q(s,a;\theta))^2$. Use target network parameters $\theta^-$ updated periodically, and epsilon-greedy action selection.

### Real-world examples
- Atari-like control tasks.
- Sequential recommendation simplifications.
- Network routing simulation with large state vectors.

### Strategic benefits
- Handles large, continuous observation spaces.
- Learns nonlinear value approximations.
- Replay improves sample reuse.

### Limitations and failure modes
- Training can still be unstable.
- Sensitive to replay, target update, and exploration schedules.
- Struggles with continuous action spaces.

### Code snippet (Python, runnable)
```python
# Minimal DQN-style update loop skeleton in PyTorch
import torch
import torch.nn as nn
import torch.optim as optim

class QNet(nn.Module):
    def __init__(self, obs_dim, act_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(obs_dim, 128), nn.ReLU(),
            nn.Linear(128, 128), nn.ReLU(),
            nn.Linear(128, act_dim),
        )
    def forward(self, x):
        return self.net(x)

obs_dim, act_dim = 8, 4
online = QNet(obs_dim, act_dim)
target = QNet(obs_dim, act_dim)
target.load_state_dict(online.state_dict())
opt = optim.Adam(online.parameters(), lr=1e-3)

batch_s = torch.randn(32, obs_dim)
batch_a = torch.randint(0, act_dim, (32, 1))
batch_r = torch.randn(32, 1)
batch_s2 = torch.randn(32, obs_dim)
batch_done = torch.randint(0, 2, (32, 1)).float()

gamma = 0.99
with torch.no_grad():
    target_q = batch_r + gamma * (1 - batch_done) * target(batch_s2).max(dim=1, keepdim=True).values
pred_q = online(batch_s).gather(1, batch_a)
loss = nn.MSELoss()(pred_q, target_q)

opt.zero_grad(); loss.backward(); opt.step()
print("DQN update loss:", round(loss.item(), 6))
```

### Diagram description
Replay buffer feeds mini-batches to Online Q-Network; Target Q-Network computes stable targets; periodic parameter copy arrow from Online to Target.

### Self-check quiz
1. Replay buffer mainly helps by:
A) Increasing overfitting to latest sample
B) Breaking correlation and reusing experiences
C) Removing reward signal
D) Making model linear

Answer: B
Explanation: Random batches stabilize and improve sample efficiency.

2. Target network purpose:
A) Faster UI rendering
B) Stabilize bootstrapped targets
C) Replace replay buffer
D) Compute supervised labels only

Answer: B
Explanation: Slowly changing targets reduce divergence risk.

3. Standard DQN action space is usually:
A) Continuous high-dimensional
B) Discrete
C) Text-only
D) Multi-agent only

Answer: B
Explanation: DQN is designed for discrete action choices.

---

## Sub-section: Proximal Policy Optimization (PPO)

### Title and one-line definition
PPO is a policy-gradient actor-critic method that updates policy with a clipped objective to avoid destructive large steps.

### Intuition
Policy optimization can collapse if updates are too aggressive. PPO acts like training with a safety belt: improve policy, but clip incentive for moving too far from the previous policy in one update. This keeps learning stable while still improving returns.

### How it actually works
Collect trajectories with old policy $\pi_{old}$. Optimize clipped surrogate objective:
$L^{clip}(\theta)=\mathbb{E}[\min(r_t(\theta)A_t, \text{clip}(r_t(\theta),1-\epsilon,1+\epsilon)A_t)]$, where $r_t=\pi_\theta(a_t|s_t)/\pi_{old}(a_t|s_t)$. Combine with value loss and entropy bonus.

### Real-world examples
- Robotics locomotion training.
- Game AI policy learning.
- Traffic signal control simulation.

### Strategic benefits
- Better stability than naive policy gradients.
- Works well across many continuous-control tasks.
- Practical default in modern RL stacks.

### Limitations and failure modes
- Still sample-intensive.
- Hyperparameters (clip range, epochs, batch size) matter.
- Reward shaping quality remains critical.

### Code snippet (Python, runnable)
```python
# PPO-style clipped objective demo with PyTorch tensors
import torch

batch = 64
clip_eps = 0.2

old_logp = torch.randn(batch)
new_logp = old_logp + 0.1 * torch.randn(batch)
adv = torch.randn(batch)

ratio = torch.exp(new_logp - old_logp)
unclipped = ratio * adv
clipped = torch.clamp(ratio, 1 - clip_eps, 1 + clip_eps) * adv
policy_loss = -torch.mean(torch.min(unclipped, clipped))

# Typical PPO also includes value and entropy terms
value_pred = torch.randn(batch)
value_target = torch.randn(batch)
value_loss = torch.mean((value_pred - value_target) ** 2)
entropy_bonus = -torch.mean(torch.distributions.Normal(0, 1).log_prob(torch.randn(batch)))

total_loss = policy_loss + 0.5 * value_loss - 0.01 * entropy_bonus
print("Policy loss:", round(policy_loss.item(), 6))
print("Total PPO-style loss:", round(total_loss.item(), 6))
```

### Diagram description
Trajectory collection with old policy -> Advantage estimation -> Clipped objective optimizer -> Updated policy, with a trust-region style guardrail icon.

### Self-check quiz
1. PPO clipping is meant to:
A) Increase variance of updates
B) Prevent excessively large policy updates
C) Eliminate exploration
D) Replace value function

Answer: B
Explanation: Clipping limits incentive for large policy ratio changes.

2. PPO typically combines:
A) Policy loss only
B) Policy, value, and entropy terms
C) K-means objective
D) Decision tree pruning

Answer: B
Explanation: Actor-critic training uses all three components.

3. A key practical advantage of PPO is:
A) Guaranteed global optimum
B) Strong training stability in many tasks
C) No hyperparameters needed
D) Works without rewards

Answer: B
Explanation: PPO is widely used because it is comparatively stable.

# Convolutional Neural Networks (CNNs)

**Title and one-line definition**
CNNs are neural networks specialized for grid-like data (especially images) using convolutional filters to learn spatial hierarchies.

## Intuition
A CNN acts like a stack of feature detectors. Early layers detect edges and textures, middle layers detect motifs, and later layers detect semantic objects. Weight sharing lets one filter detect the same pattern anywhere in the image. Pooling and strides reduce resolution while preserving salient information.

## How it actually works
Convolution applies learnable kernels across local receptive fields. Nonlinear activations and normalization increase representational capacity and stability. Stacked conv blocks create deep features; a classifier head maps features to labels. Training uses backpropagation with cross-entropy (for classification) and optimizers like Adam/SGD.

## Real-world examples
- Medical image triage (x-ray abnormality detection).
- Visual quality inspection in manufacturing.
- OCR and document vision pipelines.

## Strategic benefits
- Parameter efficiency via local connectivity and shared kernels.
- Strong inductive bias for spatial structure.
- High accuracy for many vision tasks.

## Limitations and failure modes
- Data-hungry for high-performance production models.
- Sensitive to distribution shift (lighting, camera changes).
- Can fail under adversarial perturbations.

## Code snippet (Python, runnable)
```python
# Minimal CNN on MNIST using TensorFlow Keras
import tensorflow as tf

(x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()
x_train = (x_train / 255.0)[..., None]
x_test = (x_test / 255.0)[..., None]

model = tf.keras.Sequential([
    tf.keras.layers.Conv2D(32, 3, activation="relu", input_shape=(28, 28, 1)),
    tf.keras.layers.MaxPooling2D(),
    tf.keras.layers.Conv2D(64, 3, activation="relu"),
    tf.keras.layers.MaxPooling2D(),
    tf.keras.layers.Flatten(),
    tf.keras.layers.Dense(128, activation="relu"),
    tf.keras.layers.Dense(10, activation="softmax"),
])

model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
model.fit(x_train[:12000], y_train[:12000], epochs=2, batch_size=128, verbose=0)
loss, acc = model.evaluate(x_test[:2000], y_test[:2000], verbose=0)
print("Eval loss:", round(loss, 4), "Eval accuracy:", round(acc, 4))
```

## Diagram description
Image -> Conv+ReLU -> Pool -> Conv+ReLU -> Pool -> Flatten -> Dense -> Softmax class probabilities.

## Self-check quiz
1. CNN parameter efficiency largely comes from:
A) Fully connected layers only
B) Weight sharing in convolution filters
C) No activations
D) Random masking

Answer: B
Explanation: Shared kernels reuse parameters across spatial locations.

2. Pooling layers mainly:
A) Increase image resolution
B) Downsample feature maps and improve invariance
C) Add labels
D) Replace convolution

Answer: B
Explanation: Pooling reduces spatial size while retaining strong activations.

3. CNNs are strongest on:
A) Grid-structured data like images
B) Pure SQL queries
C) Symbolic logic only
D) Audio metadata tables only

Answer: A
Explanation: CNN inductive biases match local spatial correlations.

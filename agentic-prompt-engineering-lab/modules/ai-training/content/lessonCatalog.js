export const lessonCatalog = [
  {
    id: "paradigms",
    title: "Core AI Learning Paradigms",
    description: "Supervised, unsupervised, reinforcement, semi-supervised, and self-supervised methods.",
    lessons: [
      { id: "supervised", title: "Supervised Learning", file: "01_supervised_learning.md" },
      { id: "unsupervised", title: "Unsupervised Learning", file: "02_unsupervised_learning.md" },
      { id: "reinforcement", title: "Reinforcement Learning", file: "03_reinforcement_learning.md" },
      { id: "semi-supervised", title: "Semi-Supervised Learning", file: "04_semi_supervised_learning.md" },
      { id: "self-supervised", title: "Self-Supervised Learning", file: "05_self_supervised_learning.md" }
    ]
  },
  {
    id: "deep-learning",
    title: "Advanced Deep Learning Architectures",
    description: "CNNs, RNN/LSTM, Transformers and attention, GANs, and VAEs.",
    lessons: [
      { id: "cnn", title: "Convolutional Neural Networks", file: "06_convolutional_neural_networks.md" },
      { id: "rnn-lstm", title: "RNN and LSTM", file: "07_rnn_and_lstm.md" },
      { id: "transformers", title: "Transformers and Attention", file: "08_transformers_and_attention.md" },
      { id: "gans-vaes", title: "GANs and VAEs", file: "09_gans_and_vaes.md" }
    ]
  },
  {
    id: "optimization",
    title: "Optimization and Efficiency Techniques",
    description: "Transfer learning, tuning, pruning, quantization, and distillation.",
    lessons: [
      { id: "transfer-learning", title: "Transfer Learning", file: "10_transfer_learning.md" },
      { id: "hyperparameter-tuning", title: "Hyperparameter Tuning", file: "11_hyperparameter_tuning.md" },
      { id: "pruning", title: "Model Pruning", file: "12_model_pruning.md" },
      { id: "quantization", title: "Quantization", file: "13_quantization.md" },
      { id: "distillation", title: "Knowledge Distillation", file: "14_knowledge_distillation.md" }
    ]
  },
  {
    id: "workflow",
    title: "AI Model Development Workflow",
    description: "Interactive six-step path from problem definition to deployment monitoring.",
    lessons: [
      { id: "problem-definition", title: "1. Problem Definition", file: "15_problem_definition.md" },
      { id: "data-preparation", title: "2. Data Preparation", file: "16_data_preparation.md" },
      { id: "model-selection", title: "3. Model Selection", file: "17_model_selection.md" },
      { id: "training", title: "4. Training", file: "18_training.md" },
      { id: "evaluation", title: "5. Evaluation", file: "19_evaluation.md" },
      { id: "deployment-monitoring", title: "6. Deployment and Monitoring", file: "20_deployment_and_monitoring.md" }
    ]
  }
];

export const allLessons = lessonCatalog.flatMap((category) =>
  category.lessons.map((lesson, index) => ({
    ...lesson,
    categoryId: category.id,
    categoryTitle: category.title,
    categoryDescription: category.description,
    order: index + 1,
  }))
);

export const lessonById = Object.fromEntries(allLessons.map((lesson) => [lesson.id, lesson]));

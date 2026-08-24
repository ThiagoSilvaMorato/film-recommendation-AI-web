import * as tf from '@tensorflow/tfjs'

/** Same architecture as exemplo-01's configureNeuralNetAndTrain: 128 -> 64 -> 32 -> 1. */
export function createModel(inputDimension: number): tf.Sequential {
  const model = tf.sequential()

  model.add(tf.layers.dense({ inputShape: [inputDimension], units: 128, activation: 'relu' }))
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }))
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }))
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }))

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  })

  return model
}

export interface TrainOptions {
  epochs: number
  batchSize?: number
  onEpochEnd: (epoch: number, loss: number, accuracy: number) => void
}

export async function trainModel(
  model: tf.LayersModel,
  xs: tf.Tensor2D,
  ys: tf.Tensor2D,
  { epochs, batchSize = 32, onEpochEnd }: TrainOptions
): Promise<{ finalLoss: number; finalAccuracy: number }> {
  const history = await model.fit(xs, ys, {
    epochs,
    batchSize,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        onEpochEnd(epoch, logs?.loss ?? 0, logs?.acc ?? 0)
      },
    },
  })

  const losses = history.history.loss as number[]
  const accuracies = history.history.acc as number[]
  return {
    finalLoss: losses[losses.length - 1] ?? 0,
    finalAccuracy: accuracies[accuracies.length - 1] ?? 0,
  }
}

export function predictBatch(model: tf.LayersModel, inputs: number[][]): number[] {
  const xs = tf.tensor2d(inputs)
  try {
    const output = model.predict(xs) as tf.Tensor
    const scores = Array.from(output.dataSync())
    output.dispose()
    return scores
  } finally {
    xs.dispose()
  }
}

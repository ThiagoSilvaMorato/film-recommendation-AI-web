import * as tf from '@tensorflow/tfjs'
import type { TrainingDataset } from './buildDataset'

export function createModel(inputDim: number): tf.Sequential {
  const model = tf.sequential()
  model.add(tf.layers.dense({ inputShape: [inputDim], units: 128, activation: 'relu' }))
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }))
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }))
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }))

  model.compile({
    optimizer: tf.train.adam(),
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
  dataset: TrainingDataset,
  { epochs, batchSize = 32, onEpochEnd }: TrainOptions
): Promise<{ finalLoss: number; finalAccuracy: number }> {
  const xs = tf.tensor2d(dataset.inputs.map((row) => Array.from(row)))
  const ys = tf.tensor2d(dataset.labels, [dataset.labels.length, 1])

  try {
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
  } finally {
    xs.dispose()
    ys.dispose()
  }
}

export function predictBatch(model: tf.LayersModel, inputs: Float32Array[]): number[] {
  const xs = tf.tensor2d(inputs.map((row) => Array.from(row)))
  try {
    const output = model.predict(xs) as tf.Tensor
    const scores = Array.from(output.dataSync())
    output.dispose()
    return scores
  } finally {
    xs.dispose()
  }
}

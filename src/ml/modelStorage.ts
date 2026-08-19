import * as tf from '@tensorflow/tfjs'

const MODEL_KEY = 'indexeddb://movie-recommender-model'

export async function saveModel(model: tf.LayersModel): Promise<void> {
  await model.save(MODEL_KEY)
}

export async function loadModel(): Promise<tf.LayersModel | null> {
  try {
    return await tf.loadLayersModel(MODEL_KEY)
  } catch {
    return null
  }
}

export async function clearModel(): Promise<void> {
  try {
    await tf.io.removeModel(MODEL_KEY)
  } catch {
    // nothing to remove
  }
}

/** True if the restored model's input shape matches the current encoding's expected dim. */
export function isModelShapeCompatible(model: tf.LayersModel, expectedInputDim: number): boolean {
  const shape = model.inputs[0]?.shape
  const actualDim = shape?.[shape.length - 1]
  return actualDim === expectedInputDim
}

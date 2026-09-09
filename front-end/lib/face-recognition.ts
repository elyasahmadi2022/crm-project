import * as faceapi from 'face-api.js'

let modelsLoaded = false

/**
 * Load face-api.js models from CDN
 * Models: ssdMobilenetv1, faceLandmark68Net, faceRecognitionNet
 */
export async function loadFaceRecognitionModels(): Promise<void> {
  if (modelsLoaded) return

  const MODEL_URL = '/models' // Will load from public/models

  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
    modelsLoaded = true
    console.log('✅ Face recognition models loaded')
  } catch (error) {
    console.error('❌ Failed to load face recognition models:', error)
    throw new Error('Failed to load face recognition models')
  }
}

/**
 * Detect face and extract 128-dimension descriptor from video element
 * Returns null if no face detected
 */
export async function detectFaceDescriptor(
  videoElement: HTMLVideoElement
): Promise<Float32Array | null> {
  if (!modelsLoaded) {
    await loadFaceRecognitionModels()
  }

  try {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor()

    return detection?.descriptor || null
  } catch (error) {
    console.error('Error detecting face:', error)
    return null
  }
}

/**
 * Detect face with bounding box for UI feedback
 */
export async function detectFaceWithBox(
  videoElement: HTMLVideoElement
): Promise<{ detected: boolean; box?: { x: number; y: number; width: number; height: number } }> {
  if (!modelsLoaded) {
    await loadFaceRecognitionModels()
  }

  try {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))

    if (detection) {
      return {
        detected: true,
        box: {
          x: detection.box.x,
          y: detection.box.y,
          width: detection.box.width,
          height: detection.box.height,
        },
      }
    }

    return { detected: false }
  } catch (error) {
    console.error('Error detecting face:', error)
    return { detected: false }
  }
}

/**
 * Capture image from video as base64
 */
export function captureImageFromVideo(videoElement: HTMLVideoElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight
  
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')
  
  ctx.drawImage(videoElement, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.95)
}

/**
 * Check if descriptor is valid (128 dimensions)
 */
export function isValidDescriptor(descriptor: Float32Array | number[] | null): boolean {
  if (!descriptor) return false
  return descriptor.length === 128
}

/**
 * Convert Float32Array to regular array for JSON
 */
export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor)
}

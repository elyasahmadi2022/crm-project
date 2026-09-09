"use client"

// We import the browser ESM build directly to avoid Turbopack/Next.js
// accidentally resolving the .node.js build (which requires tfjs-node).
// Dynamic import keeps this 100% client-side.

type FaceApiModule = typeof import("@vladmandic/face-api")

let fa: FaceApiModule | null = null
let modelsLoaded = false
let loadingPromise: Promise<void> | null = null

async function getFaceApi(): Promise<FaceApiModule> {
  if (!fa) {
    // Import the browser ESM bundle explicitly
    fa = (await import("@vladmandic/face-api/dist/face-api.esm.js" as any)) as FaceApiModule
  }
  return fa
}

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    try {
      const api = await getFaceApi()
      const MODEL_URL = "/models"

      await Promise.all([
        api.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        api.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])

      modelsLoaded = true
      console.log("✅ face-api models loaded")
    } catch (err) {
      loadingPromise = null
      console.error("❌ face-api load error:", err)
      throw err
    }
  })()

  return loadingPromise
}

/** Extract 128-dim descriptor from live video. Returns null if no face found. */
export async function getDescriptorFromVideo(
  video: HTMLVideoElement
): Promise<Float32Array | null> {
  await loadModels()
  const api = await getFaceApi()

  const result = await api
    .detectSingleFace(video, new api.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor()

  return result?.descriptor ?? null
}

/** Detect face and return centering info for the UI overlay. */
export async function detectFaceInVideo(video: HTMLVideoElement): Promise<{
  detected: boolean
  centered: boolean
}> {
  await loadModels()
  const api = await getFaceApi()

  const detection = await api
    .detectSingleFace(video, new api.SsdMobilenetv1Options({ minConfidence: 0.5 }))

  if (!detection) return { detected: false, centered: false }

  const box = detection.box
  const vw = video.videoWidth || 640
  const vh = video.videoHeight || 480

  const offsetX = Math.abs(box.x + box.width / 2 - vw / 2) / vw
  const offsetY = Math.abs(box.y + box.height / 2 - vh / 2) / vh
  const faceRatio = box.width / vw

  // Face is "centered" if within 20% of center and a reasonable size
  const centered = offsetX < 0.2 && offsetY < 0.25 && faceRatio > 0.18 && faceRatio < 0.8

  return { detected: true, centered }
}

/** Capture JPEG base64 from a video element */
export function captureSnapshot(video: HTMLVideoElement, quality = 0.95): string {
  const canvas = document.createElement("canvas")
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext("2d")!.drawImage(video, 0, 0)
  return canvas.toDataURL("image/jpeg", quality)
}

/** Float32Array → plain number[] for JSON serialization */
export function toArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor)
}

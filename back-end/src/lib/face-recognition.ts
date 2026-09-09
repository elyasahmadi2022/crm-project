import * as faceapi from "@vladmandic/face-api"
import canvas from "canvas"
import path from "path"
import { fileURLToPath } from "url"

const { Canvas, Image, ImageData } = canvas
// @ts-ignore
faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let modelsLoaded = false

/**
 * Initialize face-api models
 * Must be called before using face recognition
 */
export async function loadFaceRecognitionModels(): Promise<void> {
  if (modelsLoaded) return

  const MODEL_URL = path.join(__dirname, "../../models")

  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL),
    ])
    modelsLoaded = true
    console.log("✅ Face recognition models loaded successfully")
  } catch (error) {
    console.error("❌ Failed to load face recognition models:", error)
    throw new Error("Failed to initialize face recognition system")
  }
}

/**
 * Generate 128-dimension face descriptor from base64 image
 * Returns the face embedding vector
 */
export async function generateFaceDescriptor(
  base64Image: string
): Promise<Float32Array | null> {
  if (!modelsLoaded) {
    await loadFaceRecognitionModels()
  }

  try {
    // Remove data URL prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    // Load image into canvas
    const img = new Image()
    img.src = buffer

    // Detect single face with landmarks and descriptor
    const detection = await faceapi
      .detectSingleFace(img as any)
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!detection) {
      return null
    }

    // Return the 128-dimension descriptor
    return detection.descriptor
  } catch (error) {
    console.error("Error generating face descriptor:", error)
    return null
  }
}

/**
 * Compute Euclidean distance between two face descriptors
 * Lower distance = more similar faces
 */
export function computeFaceDistance(
  descriptor1: Float32Array | number[],
  descriptor2: Float32Array | number[]
): number {
  return faceapi.euclideanDistance(descriptor1 as any, descriptor2 as any)
}

/**
 * Convert Float32Array to regular array for JSON storage
 */
export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor)
}

/**
 * Convert regular array back to Float32Array for comparison
 */
export function arrayToDescriptor(arr: number[]): Float32Array {
  return new Float32Array(arr)
}

/**
 * Validate if a face descriptor is valid
 */
export function isValidDescriptor(
  descriptor: Float32Array | number[] | null
): boolean {
  if (!descriptor) return false
  const length = Array.isArray(descriptor) ? descriptor.length : descriptor.length
  return length === 128
}

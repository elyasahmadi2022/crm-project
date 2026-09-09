/**
 * Initialize face-api models
 * Must be called before using face recognition
 */
export declare function loadFaceRecognitionModels(): Promise<void>;
/**
 * Generate 128-dimension face descriptor from base64 image
 * Returns the face embedding vector
 */
export declare function generateFaceDescriptor(base64Image: string): Promise<Float32Array | null>;
/**
 * Compute Euclidean distance between two face descriptors
 * Lower distance = more similar faces
 */
export declare function computeFaceDistance(descriptor1: Float32Array | number[], descriptor2: Float32Array | number[]): number;
/**
 * Convert Float32Array to regular array for JSON storage
 */
export declare function descriptorToArray(descriptor: Float32Array): number[];
/**
 * Convert regular array back to Float32Array for comparison
 */
export declare function arrayToDescriptor(arr: number[]): Float32Array;
/**
 * Validate if a face descriptor is valid
 */
export declare function isValidDescriptor(descriptor: Float32Array | number[] | null): boolean;
//# sourceMappingURL=face-recognition.d.ts.map
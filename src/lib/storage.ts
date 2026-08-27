import { AppError } from "./errors";

export interface UploadOptions {
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
}

const DEFAULT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export class StorageService {
  /**
   * Validate image file metadata before processing
   */
  static validateImage(
    mimeType: string,
    fileSizeBytes: number,
    options: UploadOptions = {}
  ): void {
    const allowedTypes = options.allowedMimeTypes || DEFAULT_ALLOWED_MIME_TYPES;
    const maxSize = options.maxSizeBytes || DEFAULT_MAX_SIZE_BYTES;

    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      throw AppError.validation(
        `Invalid file type "${mimeType}". Allowed types: ${allowedTypes.join(", ")}`
      );
    }

    if (fileSizeBytes > maxSize) {
      throw AppError.validation(
        `File size (${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB) exceeds the ${maxSize / 1024 / 1024} MB limit.`
      );
    }
  }

  /**
   * Generate a secure, randomized storage key for uploads
   */
  static generateStorageKey(
    folder: "products" | "farms" | "avatars" | "documents",
    userId: string,
    originalFilename: string
  ): string {
    const sanitizedFilename = originalFilename
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "-")
      .replace(/-+/g, "-");
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${folder}/${userId}/${timestamp}-${randomSuffix}-${sanitizedFilename}`;
  }

  /**
   * Returns a publicly accessible URL for a given storage key
   */
  static getPublicUrl(storageKey: string): string {
    const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "https://assets.agriaqua.dev";
    return `${cdnBase}/${storageKey}`;
  }
}

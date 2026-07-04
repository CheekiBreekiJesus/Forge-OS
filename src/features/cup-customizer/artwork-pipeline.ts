import { blobToDataUrl, validateLocalAsset } from "@/features/email-composition/local-asset";
import { validateCustomizerArtwork, type CustomizerArtworkValidationResult } from "./artwork-upload";

export type ArtworkDecodeErrorKey =
  | "decodeFailed"
  | "missingDimensions"
  | "unsafeSvg"
  | "unsupportedType"
  | "fileTooLarge"
  | "unsafeFile";

export type ArtworkUploadStatus =
  | "idle"
  | "validating"
  | "loaded"
  | "invalid"
  | "failed"
  | "replaced"
  | "removed";

export type ArtworkMetadata = {
  fileName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
};

export type ArtworkPipelineSuccess = {
  ok: true;
  blob: Blob;
  previewUrl: string;
  mimeType: string;
  metadata: ArtworkMetadata;
};

export type ArtworkPipelineFailure = {
  ok: false;
  errorKey: ArtworkDecodeErrorKey;
  message: string;
};

export type ArtworkPipelineResult = ArtworkPipelineSuccess | ArtworkPipelineFailure;

const MAX_DIMENSION = 8192;
const UNSAFE_SVG_PATTERN =
  /<script|on\w+\s*=|javascript:|data:text\/html|<foreignObject/i;

function mapValidationError(
  result: Extract<CustomizerArtworkValidationResult, { ok: false }>
): ArtworkDecodeErrorKey {
  return result.errorKey;
}

export function validateArtworkFile(file: File): CustomizerArtworkValidationResult {
  return validateCustomizerArtwork(file);
}

async function decodePngDimensionsFromBuffer(buffer: ArrayBuffer): Promise<{ width: number; height: number } | null> {
  const view = new DataView(buffer);
  if (view.byteLength < 24) return null;
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  if (width < 1 || height < 1) return null;
  return { height, width };
}

async function decodeRasterDimensions(
  blob: Blob
): Promise<{ width: number; height: number } | null> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob);
      const dimensions = { height: bitmap.height, width: bitmap.width };
      bitmap.close();
      return dimensions;
    } catch {
      // fall through
    }
  }

  if (typeof Image !== "undefined") {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        resolve({ height: image.naturalHeight, width: image.naturalWidth });
        URL.revokeObjectURL(url);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      image.src = url;
    });
  }

  if (blob.type === "image/png" || blob.type === "") {
    return decodePngDimensionsFromBuffer(await blob.arrayBuffer());
  }

  return null;
}

async function validateSvgContent(blob: Blob): Promise<boolean> {
  const text = await blob.text();
  return !UNSAFE_SVG_PATTERN.test(text);
}

export async function processArtworkUpload(file: File): Promise<ArtworkPipelineResult> {
  const validation = validateArtworkFile(file);
  if (!validation.ok) {
    return {
      errorKey: mapValidationError(validation),
      message: validation.errorKey,
      ok: false
    };
  }

  const blob = file.slice(0, file.size, validation.mimeType);

  if (validation.mimeType === "image/svg+xml") {
    const safe = await validateSvgContent(blob);
    if (!safe) {
      return { errorKey: "unsafeSvg", message: "unsafeSvg", ok: false };
    }
    const previewUrl = await blobToDataUrl(blob);
    return {
      blob,
      metadata: {
        fileName: file.name,
        height: 0,
        mimeType: validation.mimeType,
        size: validation.size,
        width: 0
      },
      mimeType: validation.mimeType,
      ok: true,
      previewUrl
    };
  }

  const dimensions = await decodeRasterDimensions(blob);
  if (!dimensions) {
    return { errorKey: "decodeFailed", message: "decodeFailed", ok: false };
  }
  if (dimensions.width < 1 || dimensions.height < 1) {
    return { errorKey: "missingDimensions", message: "missingDimensions", ok: false };
  }
  if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
    return { errorKey: "missingDimensions", message: "missingDimensions", ok: false };
  }

  const previewUrl = URL.createObjectURL(blob);
  return {
    blob,
    metadata: {
      fileName: file.name,
      height: dimensions.height,
      mimeType: validation.mimeType,
      size: validation.size,
      width: dimensions.width
    },
    mimeType: validation.mimeType,
    ok: true,
    previewUrl
  };
}

export async function createPreviewUrlFromAssetBlob(blob: Blob, mimeType: string): Promise<string> {
  if (typeof window !== "undefined" && mimeType !== "image/svg+xml") {
    return URL.createObjectURL(blob);
  }
  if (typeof FileReader !== "undefined") {
    return blobToDataUrl(blob);
  }
  const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

export function validateLocalAssetForCustomizer(file: {
  name: string;
  type: string;
  size: number;
}): CustomizerArtworkValidationResult {
  const result = validateLocalAsset(file);
  if (result.ok) return result;
  const errorKey =
    result.error === "File exceeds 2 MB limit."
      ? "fileTooLarge"
      : result.error === "Executable or unsafe file types are not allowed."
        ? "unsafeFile"
        : "unsupportedType";
  return { errorKey, ok: false };
}

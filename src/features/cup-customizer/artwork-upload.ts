import { validateLocalAsset } from "@/features/email-composition/local-asset";

export type CustomizerArtworkValidationResult =
  | { ok: true; mimeType: string; size: number }
  | { ok: false; errorKey: "fileTooLarge" | "unsupportedType" | "unsafeFile" };

const ERROR_KEY_BY_MESSAGE: Partial<
  Record<string, Extract<CustomizerArtworkValidationResult, { ok: false }>["errorKey"]>
> = {
  "File exceeds 2 MB limit.": "fileTooLarge",
  "Unsupported file type. Use PNG, JPEG, WebP, GIF, or SVG.": "unsupportedType",
  "Executable or unsafe file types are not allowed.": "unsafeFile"
};

export function validateCustomizerArtwork(file: {
  name: string;
  type: string;
  size: number;
}): CustomizerArtworkValidationResult {
  const result = validateLocalAsset(file);
  if (result.ok) {
    return result;
  }
  return {
    errorKey: ERROR_KEY_BY_MESSAGE[result.error] ?? "unsupportedType",
    ok: false
  };
}

export function isSecureCameraContext(): boolean {
  if (typeof window === "undefined") return true;
  return window.isSecureContext;
}

export function isBarcodeDetectorSupported(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

export type CameraDevice = {
  deviceId: string;
  label: string;
};

export async function listVideoDevices(): Promise<CameraDevice[]> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return [];
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((d) => d.kind === "videoinput")
    .map((d, index) => ({
      deviceId: d.deviceId,
      label: d.label || `Camera ${index + 1}`
    }));
}

export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export async function requestCameraStream(deviceId?: string): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    video: deviceId
      ? { deviceId: { exact: deviceId }, facingMode: { ideal: "environment" } }
      : { facingMode: { ideal: "environment" } },
    audio: false
  };
  return navigator.mediaDevices.getUserMedia(constraints);
}

export async function setTorchEnabled(track: MediaStreamTrack | null, enabled: boolean): Promise<boolean> {
  if (!track) return false;
  try {
    await track.applyConstraints({ advanced: [{ torch: enabled } as MediaTrackConstraintSet] });
    return true;
  } catch {
    return false;
  }
}

export function isTorchSupported(track: MediaStreamTrack | null): boolean {
  if (!track?.getCapabilities) return false;
  const caps = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
  return Boolean(caps.torch);
}

const BARCODE_FORMATS = [
  "code_128",
  "code_39",
  "code_93",
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "itf",
  "codabar",
  "qr_code",
  "data_matrix"
] as const;

export type DetectedBarcode = {
  rawValue: string;
};

export async function detectBarcodesFromVideo(
  video: HTMLVideoElement
): Promise<DetectedBarcode[]> {
  if (!isBarcodeDetectorSupported()) return [];
  const Detector = window.BarcodeDetector as new (options?: {
    formats: readonly string[];
  }) => {
    detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
  };
  const detector = new Detector({ formats: [...BARCODE_FORMATS] });
  const results = await detector.detect(video);
  return results.map((r) => ({ rawValue: r.rawValue }));
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: readonly string[] }) => {
      detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
    };
  }
}

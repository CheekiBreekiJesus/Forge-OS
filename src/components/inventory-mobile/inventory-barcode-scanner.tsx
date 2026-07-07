"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createScanCooldown } from "@/features/inventory-mobile/scan-cooldown";
import {
  detectBarcodesFromVideo,
  isBarcodeDetectorSupported,
  isSecureCameraContext,
  isTorchSupported,
  listVideoDevices,
  requestCameraStream,
  setTorchEnabled,
  stopMediaStream,
  type CameraDevice
} from "@/features/inventory-mobile/camera-context";
import type { InventoryMobileCopy } from "@/features/inventory-mobile/copy";
import { inputClassName } from "@/components/crud";

type ScanPhase =
  | "idle"
  | "scanning"
  | "detected"
  | "permission_denied"
  | "insecure"
  | "no_camera"
  | "unsupported"
  | "stopped";

type InventoryBarcodeScannerProps = {
  copy: InventoryMobileCopy;
  onCodeDetected: (code: string) => void;
  paused?: boolean;
};

export function InventoryBarcodeScanner({
  copy,
  onCodeDetected,
  paused = false
}: InventoryBarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const cooldownRef = useRef(createScanCooldown());
  const pausedRef = useRef(paused);
  const onCodeDetectedRef = useRef(onCodeDetected);
  const detectedStatusRef = useRef(copy.scanner.scanStatus.detected);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [manualCode, setManualCode] = useState("");
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [statusMessage, setStatusMessage] = useState(copy.scanner.scanStatus.idle);

  useEffect(() => {
    pausedRef.current = paused;
    onCodeDetectedRef.current = onCodeDetected;
    detectedStatusRef.current = copy.scanner.scanStatus.detected;
  }, [copy.scanner.scanStatus.detected, onCodeDetected, paused]);

  const stopCameraTracks = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopCameraTracks();
    setTorchOn(false);
    setTorchAvailable(false);
    setPhase((current) => (current === "scanning" || current === "detected" ? "stopped" : current));
    setStatusMessage(copy.scanner.scanStatus.stopped);
  }, [copy.scanner.scanStatus.stopped, stopCameraTracks]);

  const runScanLoop = useRef(async () => {});

  useEffect(() => stopCameraTracks, [stopCameraTracks]);

  useEffect(() => {
    runScanLoop.current = async () => {
      if (pausedRef.current) return;
      const video = videoRef.current;
      if (!video || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(() => {
          void runScanLoop.current();
        });
        return;
      }
      try {
        const results = await detectBarcodesFromVideo(video);
        const first = results[0];
        if (first?.rawValue && !pausedRef.current) {
          if (!cooldownRef.current.shouldAccept(first.rawValue)) {
            rafRef.current = requestAnimationFrame(() => {
              void runScanLoop.current();
            });
            return;
          }
          stopCameraTracks();
          setPhase("detected");
          setStatusMessage(detectedStatusRef.current);
          onCodeDetectedRef.current(first.rawValue);
          return;
        }
      } catch {
        // ignore transient detection errors
      }
      rafRef.current = requestAnimationFrame(() => {
        void runScanLoop.current();
      });
    };
  }, [stopCameraTracks]);

  const startCamera = useCallback(async () => {
    cooldownRef.current.reset();
    if (!isSecureCameraContext()) {
      setPhase("insecure");
      setStatusMessage(copy.scanner.scanStatus.insecureContext);
      return;
    }
    if (!isBarcodeDetectorSupported()) {
      setPhase("unsupported");
      setStatusMessage(copy.scanner.scanStatus.unsupported);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase("unsupported");
      setStatusMessage(copy.scanner.scanStatus.unsupported);
      return;
    }

    try {
      const stream = await requestCameraStream(selectedDeviceId || undefined);
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stopMediaStream(stream);
        return;
      }
      video.srcObject = stream;
      await video.play();
      const track = stream.getVideoTracks()[0] ?? null;
      setTorchAvailable(isTorchSupported(track));
      const cameraList = await listVideoDevices();
      setDevices(cameraList);
      if (!selectedDeviceId && cameraList[0]) {
        setSelectedDeviceId(cameraList[0].deviceId);
      }
      setPhase("scanning");
      setStatusMessage(copy.scanner.scanStatus.scanning);
      void runScanLoop.current();
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setPhase("permission_denied");
        setStatusMessage(copy.scanner.scanStatus.permissionDenied);
        return;
      }
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setPhase("no_camera");
        setStatusMessage(copy.scanner.scanStatus.noCamera);
        return;
      }
      setPhase("unsupported");
      setStatusMessage(copy.scanner.scanStatus.unsupported);
    }
  }, [
    copy.scanner.scanStatus.insecureContext,
    copy.scanner.scanStatus.noCamera,
    copy.scanner.scanStatus.permissionDenied,
    copy.scanner.scanStatus.scanning,
    copy.scanner.scanStatus.unsupported,
    selectedDeviceId
  ]);

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0] ?? null;
    const next = !torchOn;
    const ok = await setTorchEnabled(track, next);
    if (ok) setTorchOn(next);
  }

  function submitManual(event: React.FormEvent) {
    event.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    stopCamera();
    onCodeDetected(code);
  }

  const showScannerFrame = phase === "scanning" || phase === "detected";

  return (
    <div className="space-y-4" data-testid="inventory-barcode-scanner">
      <div
        aria-live="polite"
        className="rounded-xl border border-[var(--forge-border)] bg-[var(--forge-surface-muted)] p-4"
      >
        <p className="text-sm font-medium text-[var(--forge-text-secondary)]">{statusMessage}</p>
        <p className="mt-1 text-xs text-[var(--forge-text-muted)]">{copy.scanner.scanArea}</p>

        <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-lg border-2 border-dashed border-[var(--forge-accent-orange)] bg-black/80">
          <video
            ref={videoRef}
            autoPlay
            className={`h-full w-full object-cover ${showScannerFrame ? "opacity-100" : "opacity-0"}`}
            muted
            playsInline
          />
          {!showScannerFrame ? (
            <div className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-white/80">
              {phase === "idle" || phase === "stopped"
                ? copy.scanner.scanStatus.idle
                : statusMessage}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {phase !== "scanning" && phase !== "detected" ? (
            <button
              className="min-h-11 rounded-lg bg-[var(--forge-accent-orange)] px-4 py-2 text-sm font-semibold text-white"
              onClick={() => void startCamera()}
              type="button"
            >
              {copy.scanner.controls.startCamera}
            </button>
          ) : (
            <button
              className="min-h-11 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-4 py-2 text-sm font-semibold"
              onClick={stopCamera}
              type="button"
            >
              {copy.scanner.controls.stopCamera}
            </button>
          )}
          {torchAvailable ? (
            <button
              className="min-h-11 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-4 py-2 text-sm font-semibold"
              onClick={() => void toggleTorch()}
              type="button"
            >
              {torchOn ? copy.scanner.controls.torchOff : copy.scanner.controls.torchOn}
            </button>
          ) : null}
        </div>

        {devices.length > 1 ? (
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-medium">{copy.scanner.controls.selectCamera}</span>
            <select
              className={inputClassName}
              onChange={(event) => setSelectedDeviceId(event.target.value)}
              value={selectedDeviceId}
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <form className="space-y-3 rounded-xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-4" onSubmit={submitManual}>
        <label className="block text-sm font-semibold">{copy.scanner.manualEntry.label}</label>
        <p className="text-xs text-[var(--forge-text-muted)]">{copy.scanner.manualEntry.hint}</p>
        <input
          autoComplete="off"
          className={`${inputClassName} min-h-12 text-base`}
          data-testid="manual-barcode-input"
          onChange={(event) => setManualCode(event.target.value)}
          placeholder={copy.scanner.manualEntry.placeholder}
          value={manualCode}
        />
        <button
          className="min-h-12 w-full rounded-lg bg-[var(--forge-accent-orange)] px-4 py-3 text-base font-semibold text-white"
          type="submit"
        >
          {copy.scanner.manualEntry.submit}
        </button>
      </form>
    </div>
  );
}

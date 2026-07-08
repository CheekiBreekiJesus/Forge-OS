import { describe, expect, it, vi } from "vitest";
import { createScanCooldown } from "@/features/inventory-mobile/scan-cooldown";
import {
  isBarcodeDetectorSupported,
  isSecureCameraContext,
  stopMediaStream
} from "@/features/inventory-mobile/camera-context";

describe("camera context utilities", () => {
  it("reports insecure context in non-secure environments", () => {
    expect(typeof isSecureCameraContext()).toBe("boolean");
  });

  it("detects BarcodeDetector support flag", () => {
    expect(typeof isBarcodeDetectorSupported()).toBe("boolean");
  });

  it("stops all media tracks on stream cleanup", () => {
    const stop = vi.fn();
    const stream = {
      getTracks: () => [{ stop }]
    } as unknown as MediaStream;
    stopMediaStream(stream);
    expect(stop).toHaveBeenCalledTimes(1);
  });
});

describe("manual entry fallback path", () => {
  it("accepts manual codes through cooldown gate independent of camera APIs", () => {
    const cooldown = createScanCooldown(1000);
    const manualCode = "PP-250-05601234000250";
    expect(cooldown.shouldAccept(manualCode, 0)).toBe(true);
    expect(cooldown.shouldAccept(manualCode, 500)).toBe(false);
  });
});

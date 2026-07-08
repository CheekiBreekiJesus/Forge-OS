export function vibrateScanSuccess(): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(80);
  }
}

export function vibrateScanError(): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate([40, 60, 40]);
  }
}

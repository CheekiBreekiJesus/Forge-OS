export function assertOutlookServerOnlyModule(): void {
  if (typeof window !== "undefined") {
    throw new Error("Outlook Graph modules are server-only.");
  }
}

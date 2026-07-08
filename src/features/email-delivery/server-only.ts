export function assertServerOnlyModule(): void {
  if (typeof window !== "undefined") {
    throw new Error("Email delivery provider modules are server-only.");
  }
}

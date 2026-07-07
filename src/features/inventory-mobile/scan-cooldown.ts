const DEFAULT_COOLDOWN_MS = 2000;

export function createScanCooldown(cooldownMs = DEFAULT_COOLDOWN_MS) {
  let lastCode: string | null = null;
  let lastAt = 0;

  return {
    shouldAccept(code: string, now = Date.now()): boolean {
      const normalized = code.trim();
      if (!normalized) return false;
      if (lastCode === normalized && now - lastAt < cooldownMs) {
        return false;
      }
      lastCode = normalized;
      lastAt = now;
      return true;
    },
    reset(): void {
      lastCode = null;
      lastAt = 0;
    }
  };
}

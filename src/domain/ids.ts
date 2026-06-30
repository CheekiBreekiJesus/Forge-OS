/** Predictable, collision-resistant IDs for local MVP records. */
export function createRecordId(prefix: string): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${time}_${random}`;
}

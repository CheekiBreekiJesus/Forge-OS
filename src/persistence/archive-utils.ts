export type ArchiveInput = {
  archivedBy?: string | null;
  archiveReason?: string | null;
};

export type ArchivableFields = {
  active: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
};

export const DEFAULT_ARCHIVABLE: ArchivableFields = {
  active: true,
  archivedAt: null,
  archivedBy: null,
  archiveReason: null
};

export function isActiveRecord(record: {
  active?: boolean;
  archivedAt?: string | null;
}): boolean {
  return record.active !== false && !record.archivedAt;
}

export function createArchivePatch(
  input?: ArchiveInput,
  now: string = new Date().toISOString()
): ArchivableFields {
  return {
    active: false,
    archivedAt: now,
    archivedBy: input?.archivedBy ?? "local-preview",
    archiveReason: input?.archiveReason ?? null
  };
}

export function createRestorePatch(): ArchivableFields {
  return { ...DEFAULT_ARCHIVABLE };
}

export function withArchiveDefaults<T extends object>(record: T): T & ArchivableFields {
  return {
    ...DEFAULT_ARCHIVABLE,
    ...record,
    active: (record as { active?: boolean }).active ?? true,
    archivedAt: (record as { archivedAt?: string | null }).archivedAt ?? null,
    archivedBy: (record as { archivedBy?: string | null }).archivedBy ?? null,
    archiveReason: (record as { archiveReason?: string | null }).archiveReason ?? null
  };
}

export type ListOptions = {
  includeArchived?: boolean;
};

export function filterByArchive<T extends { active?: boolean; archivedAt?: string | null }>(
  rows: T[],
  options?: ListOptions
): T[] {
  if (options?.includeArchived) return rows;
  return rows.filter(isActiveRecord);
}

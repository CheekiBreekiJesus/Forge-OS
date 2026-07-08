export function toggleLeadSelection(
  selectedLeadIds: string[],
  leadId: string
): string[] {
  if (selectedLeadIds.includes(leadId)) {
    return selectedLeadIds.filter((id) => id !== leadId);
  }

  return [...selectedLeadIds, leadId];
}

export function toggleSelectAllVisible(
  selectedLeadIds: string[],
  visibleLeadIds: string[]
): string[] {
  if (visibleLeadIds.length === 0) {
    return selectedLeadIds;
  }

  const allVisibleSelected = visibleLeadIds.every((leadId) => selectedLeadIds.includes(leadId));

  if (allVisibleSelected) {
    return selectedLeadIds.filter((leadId) => !visibleLeadIds.includes(leadId));
  }

  const merged = new Set([...selectedLeadIds, ...visibleLeadIds]);
  return [...merged];
}

export function areAllVisibleSelected(
  selectedLeadIds: string[],
  visibleLeadIds: string[]
): boolean {
  return visibleLeadIds.length > 0 && visibleLeadIds.every((leadId) => selectedLeadIds.includes(leadId));
}

export function isLeadSelected(selectedLeadIds: string[], leadId: string): boolean {
  return selectedLeadIds.includes(leadId);
}

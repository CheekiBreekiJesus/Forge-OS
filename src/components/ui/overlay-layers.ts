/**
 * Shared overlay z-index layers for ForgeOS UI.
 * Table action menus sit above sticky headers (z-10) but below modals (z-40+).
 */
export const OVERLAY_Z_INDEX = {
  stickyHeader: 10,
  tableActionMenu: 30,
  mobileNavBackdrop: 40,
  modal: 50,
  archiveDialog: 60,
  commandPalette: 70,
  hostedFeatures: 80
} as const;

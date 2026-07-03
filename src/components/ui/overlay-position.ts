export type MenuPosition = {
  top: number;
  left: number;
  minWidth: number;
};

export const MENU_COLLISION_PADDING = 8;

export function computeMenuPosition(
  triggerRect: { top: number; bottom: number; right: number; width: number },
  menuHeight: number,
  menuWidth: number,
  viewport: { width: number; height: number } = {
    width: typeof window !== "undefined" ? window.innerWidth : 1440,
    height: typeof window !== "undefined" ? window.innerHeight : 900
  }
): MenuPosition {
  let top = triggerRect.bottom + 4;
  if (top + menuHeight + MENU_COLLISION_PADDING > viewport.height) {
    top = Math.max(MENU_COLLISION_PADDING, triggerRect.top - menuHeight - 4);
  }

  let left = triggerRect.right - menuWidth;
  if (left < MENU_COLLISION_PADDING) {
    left = MENU_COLLISION_PADDING;
  }
  if (left + menuWidth + MENU_COLLISION_PADDING > viewport.width) {
    left = Math.max(MENU_COLLISION_PADDING, viewport.width - menuWidth - MENU_COLLISION_PADDING);
  }

  return {
    top,
    left,
    minWidth: Math.max(menuWidth, triggerRect.width)
  };
}

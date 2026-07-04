# Overlay and action menus

Row action menus in data tables use a portaled overlay so they are not clipped by table scroll containers.

## Root cause

Table wrappers use `overflow-x-auto` for horizontal scrolling. Menus positioned with `absolute` inside cells are clipped by overflow ancestors and the app shell `overflow-x-clip`.

## Solution

`DataTableActionMenu` (`src/components/crud/data-table-action-menu.tsx`):

1. Renders menu content via `createPortal(..., document.body)`
2. Uses `position: fixed` with coordinates from `getBoundingClientRect()`
3. Repositions on scroll/resize (capture phase listener)
4. Collision detection via `computeMenuPosition` (`src/components/ui/overlay-position.ts`)

## Z-index layers

Defined in `src/components/ui/overlay-layers.ts`:

| Layer | z-index |
|-------|---------|
| Sticky header | 10 |
| **Table action menu** | **30** |
| Mobile nav backdrop | 40 |
| Modals / drawers | 50 |
| Archive dialog | 60 |
| Command palette | 70 |

Table menus stay below modals and command palette.

## Collision behavior

- **Bottom edge:** menu opens upward when insufficient space below
- **Right edge:** menu shifts left to remain in viewport
- Padding: 8px from viewport edges

## Accessibility

- Trigger: `aria-expanded`, `aria-haspopup`, `aria-controls`
- Menu: `role="menu"`, items `role="menuitem"`
- Keyboard: ArrowUp/Down, Enter, Space, Escape
- Focus returns to trigger on close

## Usage

`RowActionMenu` delegates to `DataTableActionMenu` for backward compatibility. Business logic for actions stays in module shells.

## Do not

- Remove `overflow-x-auto` from all tables globally
- Apply extreme z-index values to arbitrary elements
- Edit action business logic when fixing presentation

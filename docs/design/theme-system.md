# ForgeOS Theme System

## Modes

- `dark` (default)
- `light`
- `system` (optional preference value; toggle switches explicit light/dark)

## Architecture

1. `src/theme/tokens.css` defines semantic variables for both themes under `[data-theme="dark"]` and `[data-theme="light"]`.
2. `ThemeInitScript` runs before paint to set `document.documentElement.dataset.theme`.
3. `ThemeProvider` wraps the localized app tree in `PersistenceRoot`.
4. `ThemeToggle` in the top bar switches explicit light/dark preference.

## Persistence

- Storage key: `forgeos:theme`
- Locale changes do not reset theme preference.

## Semantic tokens

| Token | Purpose |
|-------|---------|
| `--forge-page-bg` | Application background |
| `--forge-sidebar-bg` | Sidebar surface |
| `--forge-topbar-bg` | Header surface |
| `--forge-surface` | Card background |
| `--forge-border` | Standard borders |
| `--forge-text-primary` | Primary text |
| `--forge-accent-orange` | ForgeOS accent |
| `--forge-accent-blue` | Links and charts |
| `--forge-success` / `--forge-warning` / `--forge-danger` | Status colors |

## Shared UI classes

Exported from `src/theme/ui-classes.ts`:

- `panelClass`
- `navLinkClass` / `navLinkActiveClass`
- `statusToneClasses`

## Accessibility

- Theme toggle exposes localized `aria-label`
- Focus outlines use accent orange
- Chart panels include `role="img"` summaries

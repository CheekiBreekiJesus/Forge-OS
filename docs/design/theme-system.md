# ForgeOS Theme System

Date: 2026-07-01

## Implementation

The theme system is CSS-variable based. Tokens live in `src/app/globals.css` and are applied through `html[data-theme]`.

Core tokens include page background, sidebar background, top bar background, surface, elevated surface, border, subtle border, text, muted text, orange accent, semantic status colors, chart grid, input background, hover background, and selected background.

## Persistence

Theme mode persists in local storage under `forgeos:theme`.

Allowed values:

- `dark`
- `light`
- `system`

The pre-hydration script in `src/app/layout.tsx` applies the stored mode before React hydration.

## Toggle

The top bar theme toggle cycles `dark -> light -> system -> dark`. It has a localized accessible label and preserves state across locale navigation.

## Dashboard Preferences

The dashboard density preference persists in `forgeos:dashboard-density`.

Allowed values:

- `comfortable`
- `compact`

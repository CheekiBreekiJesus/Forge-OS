# ForgeOS Home Dashboard

## Route

- `/{locale}` — localized operational dashboard

## Data sources

| Panel | Source |
|-------|--------|
| KPI cards | IndexedDB leads, quotes, production orders + preview fallbacks |
| OEE | Derived from production orders or preview constants |
| Inventory summary | Inventory repository or preview items |
| Alerts | Local notifications + activities |
| Production orders | Production order repository |
| Revenue | Quote totals by day or preview series |
| Marketing summary | Outreach status counters |
| Copilot | Deterministic local responses |

## Customization

Users can show/hide panels, reorder them, choose density, and set default date range. Preferences persist in `localStorage`.

## Demo labeling

Preview metrics display a localized demo label and are not presented as external machine telemetry.

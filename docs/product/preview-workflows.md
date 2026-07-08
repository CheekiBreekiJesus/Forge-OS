# Preview Workflows

Local-only preview features for demonstrating role-based navigation and quick actions. **Not authentication or authorization.**

## Role preview (`forgeos:preview-role`)

| Role | Visible modules | Quick create |
| --- | --- | --- |
| Owner | All MVP modules + Outreach | All entity types |
| Sales | Dashboard, customers, products, quotations, outreach, settings | Lead, customer, quotation, cup customizer |
| Production manager | Dashboard, products, quotations, production, machines, settings | Quotation, production, machine |
| Warehouse manager | Dashboard, products, inventory, machines, settings | Inventory, machine |

Switch via header badge **Preview role** / **Papel (pré-visualização)**.

## Command palette

- Shortcut: **Ctrl+K** (Windows/Linux) or **Cmd+K** (macOS)
- Search modules, records (leads, customers, products, quotes, production, machines, inventory)
- Quick-create actions respect preview role

## Quick create menu

Header **Create** / **Criar** dropdown deep-links to module hash routes (`#create`, `#create-lead`). Includes **Cup Customizer** at `/quotations/customizer#create`.

## Cup Customizer

In-app cup configuration, artwork preview, and estimate pricing at `/[locale]/quotations/customizer`. See `docs/architecture/cup-customizer-integration.md`.

## Customize dashboard

Shows an informational dialog — customization is deferred beyond local MVP.

## Validation path

1. Set role to **Warehouse manager** → inventory visible, outreach hidden.
2. Set role to **Sales** → outreach visible, inventory hidden.
3. Open command palette → navigate to quotations.
4. Use quick create → lands on correct module create drawer.

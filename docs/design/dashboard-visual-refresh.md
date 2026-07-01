# Dashboard Visual Refresh

Date: 2026-07-01

## References

The requested reference paths were not present in this isolated worktree. Matching images were inspected from the original checkout root:

- `forgeos-dashboard-dark.png`
- `forgeos-dashboard-light.png`

They were used as product design references for density, hierarchy, sidebar organization, card treatment, top bar composition, and dark/light theme behavior.

## Current Component Map

- Shell: `src/components/app-frame.tsx`
- Top bar controls: `src/components/app-frame-client.tsx`
- Sidebar navigation: `src/components/app-frame-nav.tsx`
- Mobile navigation: `src/components/mobile-nav-drawer.tsx`
- Dashboard: `src/components/dashboard-client-shell.tsx`
- Module placeholders: `src/components/module-page-shell.tsx`
- Marketing Studio: `src/components/marketing-studio-shell.tsx`

## Target Component Map

- `AppFrame` owns the persistent sidebar, top bar, footer, and theme-token surfaces.
- `AppFrameClient` owns command palette, notifications, quick create, locale switching, theme toggle, role preview, and local dashboard density customization.
- `AppFrameNav` renders the complete industrial module map using route configuration.
- `DashboardClientShell` renders the operational dashboard grid using local repository metrics where available.
- `ModulePageShell` renders honest localized preview pages for modules that do not yet have full CRUD implementations.

## Theme Strategy

Theme uses CSS variables in `src/app/globals.css` with `html[data-theme]`. A pre-hydration script in `src/app/layout.tsx` applies the persisted theme before React loads to avoid a visible flash.

Supported modes:

- dark
- light
- system

Selection persists in `localStorage` under `forgeos:theme`.

## Navigation Strategy

The module map is defined in `src/modules/config.ts`. Existing functional routes remain linked directly. Missing modules route to polished placeholder shells through the existing dynamic module route.

## Responsive Strategy

Desktop uses the persistent left sidebar and dense dashboard grid. Tablet and mobile keep the existing drawer navigation and single-column dashboard stacking. Tables remain horizontally scrollable where needed.

## Module Status Map

- Functional: Dashboard, Outreach, Customers, Products, Quotations/Orders, Production, Inventory, Machines, Settings, Marketing Studio.
- Preview shell: CRM, Maintenance, Molds, Quality, Purchasing, Suppliers, Sales, Billing, Reports.
- Deferred for production: auth, server persistence, RLS, live provider publishing, paid image/video generation.

## Functionality Preserved

- Outreach route and email workflow remain linked from dashboard and navigation.
- Marketing Studio routes remain intact.
- Local IndexedDB persistence remains the data source.
- Provider integrations remain disabled/local preview only.
- No customer private data or secrets are introduced.

# Dashboard Product Notes

Date: 2026-07-01

## Purpose

The ForgeOS dashboard is the operational landing page for manufacturing teams. It summarizes production, revenue estimates, quotations, delayed orders, maintenance alerts, inventory risk, Outreach, Marketing Studio, and recent activity.

## Data Sources

Current local sources:

- IndexedDB leads, customers, opportunities, quotes, production orders, inventory, activities, and marketing records.
- Seeded demo metrics when live operational telemetry or accounting data is unavailable.

## Demo Versus Real Metrics

The dashboard should not be presented as live machine telemetry or accounting. OEE and weekly charts remain demo/preview metrics. Repository-backed counts and totals are derived from local ForgeOS records.

## Customization

The Customize control opens a local dialog. It currently supports dashboard density selection and persists the preference locally.

## Outreach Priority

Outreach remains a priority workflow and is linked from the header action, sidebar, and dashboard Outreach panel.

# ForgeOS — Database Schema (MVP)

All identifiers in **English**. User-facing labels via `entity_translations` or app i18n.

## Core Tables

### `tenants`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| slug | text UNIQUE | e.g. `jh-gomes` |
| name | text | Display name (English canonical) |
| default_locale | text | `pt-PT` for JH Gomes |
| settings | jsonb | Feature flags, branding |
| created_at | timestamptz | |

### `tenant_members`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK | |
| user_id | uuid FK auth.users | |
| role | text | RBAC role key |
| created_at | timestamptz | |

### `entity_translations`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK | |
| entity_type | text | e.g. `product`, `customer` |
| entity_id | uuid | |
| language_code | text | `en`, `pt-PT`, `es-ES` |
| field_name | text | e.g. `name`, `description` |
| translated_value | text | |
| UNIQUE | (tenant_id, entity_type, entity_id, language_code, field_name) | |

### `audit_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid | |
| user_id | uuid | |
| action | text | create, update, delete |
| entity_type | text | |
| entity_id | uuid | |
| payload | jsonb | diff snapshot |
| created_at | timestamptz | |

## CRM

### `customers`
`id`, `tenant_id`, `code`, `legal_name`, `tax_id`, `email`, `phone`, `status`, `created_at`, `updated_at`

### `crm_pipeline_stages`
`id`, `tenant_id`, `key` (lead, contacted, ...), `sort_order`

### `crm_deals`
`id`, `tenant_id`, `customer_id`, `stage_id`, `title`, `value`, `currency`, `expected_close_date`, `assigned_to`, `created_at`

## Quotations

### `quotations`
`id`, `tenant_id`, `customer_id`, `number`, `status` (draft, sent, accepted, rejected), `valid_until`, `total`, `currency`, `created_by`, `created_at`

### `quotation_lines`
`id`, `quotation_id`, `product_id`, `description`, `quantity`, `unit_price`, `line_total`

## Inventory

### `products`
`id`, `tenant_id`, `sku`, `name` (English canonical), `category`, `unit`, `track_batches`, `created_at`

### `inventory_locations`
`id`, `tenant_id`, `code`, `name`, `type` (warehouse, production, quarantine)

### `inventory_stock`
`id`, `tenant_id`, `product_id`, `location_id`, `quantity`, `minimum_quantity`, `updated_at`

### `inventory_movements` (immutable ledger)
`id`, `tenant_id`, `product_id`, `from_location_id`, `to_location_id`, `quantity`, `movement_type`, `reference_type`, `reference_id`, `batch_id`, `created_by`, `created_at`

## Production

### `production_orders`
`id`, `tenant_id`, `number` (OP-045), `product_id`, `quantity`, `quantity_completed`, `status`, `planned_start`, `planned_end`, `created_at`

### `production_order_metrics` (OEE snapshots)
`id`, `tenant_id`, `recorded_at`, `availability`, `performance`, `quality`, `oee`

## Dashboard

### `dashboard_widget_configs`
`id`, `tenant_id`, `user_id`, `widget_key`, `visible`, `sort_order`, `settings` jsonb

## Indexes

- `(tenant_id)` on every tenant-scoped table
- `(tenant_id, number)` on production_orders, quotations
- `(tenant_id, product_id)` on inventory_stock

## RLS Pattern (example)

```sql
CREATE POLICY tenant_isolation ON customers
  FOR ALL
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

See `packages/database/migrations/001_initial_schema.sql` for executable SQL.

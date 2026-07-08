# ForgeOS — API Contract (MVP)

**Convention:** All paths, fields, and error codes in **English**. Responses may include localized display fields from `entity_translations` when `Accept-Language` or `locale` query param is set.

**Base URL:** `https://{project}.supabase.co/rest/v1` (PostgREST) + Next.js Route Handlers at `/api/v1/*`

**Auth:** `Authorization: Bearer <supabase_jwt>`

**Headers:**
- `X-Tenant-Id` — optional override for platform admin only
- `Accept-Language` — `pt-PT` | `en` | `es-ES`

---

## Dashboard

### `GET /api/v1/dashboard/summary`

Query: `from` (ISO date), `to` (ISO date)

```json
{
  "oee": { "value": 78.5, "change_percent": 6.4, "sparkline": [72, 74, 75, 76, 77, 78, 78.5] },
  "revenue_week": { "value": 124850, "currency": "EUR", "change_percent": 12.7 },
  "open_quotations": { "value": 18, "change": 2 },
  "overdue_orders": { "value": 7, "change": -3 },
  "maintenance_alerts": { "value": 5, "change": -1 }
}
```

### `GET /api/v1/dashboard/oee`

```json
{
  "oee": 78.5,
  "availability": 90.3,
  "performance": 76.8,
  "quality": 95.4,
  "daily": [
    { "date": "2024-05-13", "oee": 72.1 },
    { "date": "2024-05-14", "oee": 75.0 }
  ]
}
```

### `GET /api/v1/dashboard/inventory-summary`

Query: `limit=5`

```json
{
  "items": [
    {
      "product_id": "uuid",
      "sku": "ABS-NAT-001",
      "name": "ABS Natural",
      "quantity": 1250,
      "unit": "kg",
      "minimum_quantity": 500,
      "level_percent": 75
    }
  ]
}
```

### `GET /api/v1/dashboard/alerts`

```json
{
  "alerts": [
    {
      "id": "uuid",
      "severity": "high",
      "type": "maintenance",
      "message_key": "alerts.preventive_injector_02",
      "params": { "machine": "Injector 02" },
      "created_at": "2024-05-19T08:00:00Z"
    }
  ]
}
```

> UI resolves `message_key` via i18n; stored English fallback in `message` for logs only.

### `GET /api/v1/dashboard/production-orders`

Active orders for dashboard table.

### `GET /api/v1/dashboard/revenue-series`

Time series for chart widget.

### `PATCH /api/v1/dashboard/widgets`

Body: `{ "widgets": [{ "key": "oee", "visible": true, "sort_order": 0 }] }`

---

## AI Copilot

### `POST /api/v1/copilot/chat`

```json
{
  "conversation_id": "uuid | null",
  "message": "Quais moldes precisam de manutenção no próximo mês?",
  "locale": "pt-PT"
}
```

Response:

```json
{
  "conversation_id": "uuid",
  "message": "Localized markdown/text",
  "suggested_actions": [
    { "type": "create_maintenance_orders", "label_key": "copilot.actions.create_orders" }
  ],
  "tools_used": ["list_molds_maintenance_schedule"]
}
```

---

## CRM (Phase 1 stubs)

- `GET /api/v1/crm/deals`
- `POST /api/v1/crm/deals`
- `PATCH /api/v1/crm/deals/:id`

## Customers

- `GET /api/v1/customers`
- `POST /api/v1/customers`
- `GET /api/v1/customers/:id`

## Inventory

- `GET /api/v1/inventory/stock`
- `POST /api/v1/inventory/movements`

## Production

- `GET /api/v1/production/orders`
- `PATCH /api/v1/production/orders/:id/progress`

---

## Error Format

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions for this resource",
    "details": {}
  }
}
```

| HTTP | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid JWT |
| 403 | FORBIDDEN | RBAC or tenant mismatch |
| 404 | NOT_FOUND | Resource not in tenant |
| 422 | VALIDATION_ERROR | Zod validation failed |
| 500 | INTERNAL_ERROR | Unexpected (logged to Sentry) |

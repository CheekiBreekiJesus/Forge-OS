-- ForgeOS initial schema (English identifiers only)
-- Run via Supabase CLI: supabase db push

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  default_locale text NOT NULL DEFAULT 'en',
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tenant membership
CREATE TABLE tenant_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

-- Localized user-facing content
CREATE TABLE entity_translations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  language_code text NOT NULL,
  field_name text NOT NULL,
  translated_value text NOT NULL,
  UNIQUE (tenant_id, entity_type, entity_id, language_code, field_name)
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Customers
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  legal_name text NOT NULL,
  tax_id text,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

-- Products
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku text NOT NULL,
  name text NOT NULL,
  category text,
  unit text NOT NULL DEFAULT 'unit',
  track_batches boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sku)
);

-- Inventory
CREATE TABLE inventory_locations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  location_type text NOT NULL DEFAULT 'warehouse',
  UNIQUE (tenant_id, code)
);

CREATE TABLE inventory_stock (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES inventory_locations(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  minimum_quantity numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, product_id, location_id)
);

CREATE TABLE inventory_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  from_location_id uuid REFERENCES inventory_locations(id),
  to_location_id uuid REFERENCES inventory_locations(id),
  quantity numeric NOT NULL,
  movement_type text NOT NULL,
  reference_type text,
  reference_id uuid,
  batch_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Production
CREATE TABLE production_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  number text NOT NULL,
  product_id uuid REFERENCES products(id),
  quantity numeric NOT NULL,
  quantity_completed numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'planned',
  planned_start date,
  planned_end date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, number)
);

CREATE TABLE production_order_metrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  availability numeric NOT NULL,
  performance numeric NOT NULL,
  quality numeric NOT NULL,
  oee numeric NOT NULL
);

-- Quotations
CREATE TABLE quotations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id),
  number text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  valid_until date,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, number)
);

-- Dashboard preferences
CREATE TABLE dashboard_widget_configs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  widget_key text NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  settings jsonb NOT NULL DEFAULT '{}',
  UNIQUE (tenant_id, user_id, widget_key)
);

-- Indexes
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_inventory_stock_tenant ON inventory_stock(tenant_id);
CREATE INDEX idx_production_orders_tenant ON production_orders(tenant_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);

-- Seed JH Gomes tenant
INSERT INTO tenants (id, slug, name, default_locale, settings)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'jh-gomes',
  'JH Gomes',
  'pt-PT',
  '{"plan": "professional"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- RLS (enable after Supabase auth integration)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;

-- Example policy pattern (requires custom JWT claim tenant_id)
-- CREATE POLICY customers_tenant_isolation ON customers
--   FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

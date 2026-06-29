-- ForgeOS operational foundation for JH Gomes demo workflows.
-- Adds master data, configurable quotation rules, labels, routings, quality,
-- import templates, document templates, and large-order preparation structures.

create table if not exists public.article_process_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  process_key text not null,
  name text not null,
  description text not null default '',
  can_create_custom_variant boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, process_key)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, name)
);

create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, code)
);

create table if not exists public.warehouse_locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  code text not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, code)
);

alter table public.products
  add column if not exists product_code text,
  add column if not exists designation text,
  add column if not exists family text,
  add column if not exists supplier_id uuid references public.suppliers(id) on delete set null,
  add column if not exists purchase_unit text,
  add column if not exists sales_unit text,
  add column if not exists quantity_per_package numeric(12, 2),
  add column if not exists quantity_per_pallet numeric(12, 2),
  add column if not exists purchase_price numeric(12, 4),
  add column if not exists sale_price numeric(12, 4),
  add column if not exists minimum_stock numeric(12, 2),
  add column if not exists warehouse_location_id uuid references public.warehouse_locations(id) on delete set null,
  add column if not exists barcode text,
  add column if not exists qr_code text,
  add column if not exists lifecycle_status text not null default 'active',
  add column if not exists required_material_codes text[] not null default '{}',
  add column if not exists required_packaging_codes text[] not null default '{}',
  add column if not exists compatible_machine_ids uuid[] not null default '{}',
  add column if not exists process_type_key text not null default 'direct-sale',
  add column if not exists preparation_instructions text not null default '',
  add column if not exists deleted_at timestamptz;

create table if not exists public.labels_packaging (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null,
  name text not null,
  dimensions text not null,
  file_path text,
  printer_type text not null,
  required_product_information text[] not null default '{}',
  quantity_per_unit numeric(12, 4) not null default 0,
  quantity_per_pack numeric(12, 4) not null default 0,
  quantity_per_box numeric(12, 4) not null default 0,
  version integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, code, version)
);

create table if not exists public.product_labels_packaging (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  label_packaging_id uuid not null references public.labels_packaging(id) on delete restrict,
  usage_scope text not null default 'box',
  created_at timestamptz not null default now(),
  unique (tenant_id, product_id, label_packaging_id, usage_scope)
);

alter table public.machines
  add column if not exists identification text,
  add column if not exists supported_operations text[] not null default '{}',
  add column if not exists manual_paths text[] not null default '{}',
  add column if not exists standard_setup_minutes integer not null default 0,
  add column if not exists standard_production_speed_per_hour integer not null default 0,
  add column if not exists maintenance_status text not null default 'available',
  add column if not exists common_defects text[] not null default '{}',
  add column if not exists deleted_at timestamptz;

create table if not exists public.production_routings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  version integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, product_id, version)
);

create table if not exists public.production_routing_steps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  routing_id uuid not null references public.production_routings(id) on delete cascade,
  sequence integer not null,
  operation_key text not null,
  machine_type text,
  standard_minutes integer not null default 0,
  instructions text not null default '',
  required_label_ids uuid[] not null default '{}',
  required_packaging_codes text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (tenant_id, routing_id, sequence)
);

create table if not exists public.quotation_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  cup_material text not null,
  cup_type text not null,
  capacity text not null,
  color text not null,
  minimum_order_quantity integer not null check (minimum_order_quantity > 0),
  artwork_cost numeric(12, 2) not null default 0,
  plate_cost_per_color numeric(12, 2) not null default 0,
  packaging_cost numeric(12, 2) not null default 0,
  transport_cost numeric(12, 2) not null default 0,
  margin_rate numeric(8, 4) not null default 0,
  discount_rate numeric(8, 4) not null default 0,
  vat_rate numeric(8, 4) not null default 0.23,
  production_lead_time_days integer not null default 0,
  validity_days integer not null default 15,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.quotation_rule_tiers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  quotation_rule_id uuid not null references public.quotation_rules(id) on delete cascade,
  minimum_quantity integer not null check (minimum_quantity > 0),
  unit_price numeric(12, 4) not null check (unit_price >= 0),
  setup_cost numeric(12, 2) not null default 0,
  print_cost_per_color numeric(12, 2) not null default 0,
  unique (tenant_id, quotation_rule_id, minimum_quantity)
);

create table if not exists public.quote_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  version integer not null,
  calculation_snapshot jsonb not null default '{}'::jsonb,
  document_path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, quote_id, version)
);

create table if not exists public.price_override_audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete cascade,
  old_unit_price numeric(12, 4),
  new_unit_price numeric(12, 4) not null,
  reason text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.production_setup_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  production_order_id uuid references public.production_orders(id) on delete set null,
  machine_id uuid references public.machines(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  setup_parameters jsonb not null default '{}'::jsonb,
  approved_sample_path text,
  reusable_reference boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.production_orders
  add column if not exists customer_order_ref text,
  add column if not exists planned_quantity numeric(12, 2),
  add column if not exists produced_quantity numeric(12, 2) not null default 0,
  add column if not exists rejected_quantity numeric(12, 2) not null default 0,
  add column if not exists scrap_quantity numeric(12, 2) not null default 0,
  add column if not exists operator_name text,
  add column if not exists planned_start_at timestamptz,
  add column if not exists planned_end_at timestamptz,
  add column if not exists setup_start_at timestamptz,
  add column if not exists setup_end_at timestamptz,
  add column if not exists production_start_at timestamptz,
  add column if not exists production_end_at timestamptz,
  add column if not exists downtime_minutes integer not null default 0,
  add column if not exists setup_record_id uuid references public.production_setup_records(id) on delete set null,
  add column if not exists attachments text[] not null default '{}',
  add column if not exists status_history jsonb not null default '[]'::jsonb;

create table if not exists public.quality_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  workflow_type text not null,
  name text not null,
  version integer not null default 1,
  checklist jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, workflow_type, version)
);

create table if not exists public.quality_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  quality_template_id uuid references public.quality_templates(id) on delete set null,
  production_order_id uuid references public.production_orders(id) on delete set null,
  workflow_type text not null,
  result text not null default 'pending',
  findings jsonb not null default '{}'::jsonb,
  responsible_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  template_type text not null,
  name text not null,
  version integer not null default 1,
  brand_scope text not null default 'tenant',
  printable boolean not null default true,
  pdf_ready boolean not null default true,
  required_fields text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, template_type, version)
);

create table if not exists public.import_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  template_type text not null,
  name text not null,
  columns jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, template_type, version)
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  import_template_id uuid references public.import_templates(id) on delete set null,
  status text not null default 'draft',
  source_file_path text,
  error_report jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.large_order_preparations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_reference text not null,
  customer_name text not null,
  picking_status text not null default 'not-started',
  preparation_progress integer not null default 0 check (preparation_progress >= 0 and preparation_progress <= 100),
  quality_confirmed boolean not null default false,
  final_verified boolean not null default false,
  package_count integer not null default 0,
  pallet_count integer not null default 0,
  shipping_document_paths text[] not null default '{}',
  responsible_user_id uuid references public.profiles(id) on delete set null,
  notes text not null default '',
  attachments text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, order_reference)
);

create table if not exists public.large_order_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  large_order_preparation_id uuid not null references public.large_order_preparations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_code text not null,
  planned_quantity numeric(12, 2) not null,
  picked_quantity numeric(12, 2) not null default 0,
  required_labels jsonb not null default '[]'::jsonb,
  required_packaging jsonb not null default '[]'::jsonb,
  box_count integer not null default 0,
  pallet_count integer not null default 0
);

create index if not exists products_tenant_process_idx on public.products (tenant_id, process_type_key);
create index if not exists quotation_rules_tenant_active_idx on public.quotation_rules (tenant_id, active);
create index if not exists quality_records_tenant_workflow_idx on public.quality_records (tenant_id, workflow_type);
create index if not exists large_order_preparations_tenant_status_idx on public.large_order_preparations (tenant_id, picking_status);

alter table public.article_process_types enable row level security;
alter table public.suppliers enable row level security;
alter table public.warehouses enable row level security;
alter table public.warehouse_locations enable row level security;
alter table public.labels_packaging enable row level security;
alter table public.product_labels_packaging enable row level security;
alter table public.production_routings enable row level security;
alter table public.production_routing_steps enable row level security;
alter table public.quotation_rules enable row level security;
alter table public.quotation_rule_tiers enable row level security;
alter table public.quote_versions enable row level security;
alter table public.price_override_audit_logs enable row level security;
alter table public.production_setup_records enable row level security;
alter table public.quality_templates enable row level security;
alter table public.quality_records enable row level security;
alter table public.document_templates enable row level security;
alter table public.import_templates enable row level security;
alter table public.import_batches enable row level security;
alter table public.large_order_preparations enable row level security;
alter table public.large_order_lines enable row level security;

create policy "tenant members can manage article process types"
on public.article_process_types for all
using (tenant_id in (select public.current_user_tenant_ids()) or tenant_id is null)
with check (tenant_id in (select public.current_user_tenant_ids()) or tenant_id is null);

create policy "tenant members can manage suppliers"
on public.suppliers for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage warehouses"
on public.warehouses for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage warehouse locations"
on public.warehouse_locations for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage labels packaging"
on public.labels_packaging for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage product labels packaging"
on public.product_labels_packaging for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage production routings"
on public.production_routings for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage production routing steps"
on public.production_routing_steps for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage quotation rules"
on public.quotation_rules for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage quotation rule tiers"
on public.quotation_rule_tiers for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage quote versions"
on public.quote_versions for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage price override audit logs"
on public.price_override_audit_logs for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage production setup records"
on public.production_setup_records for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage quality templates"
on public.quality_templates for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage quality records"
on public.quality_records for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage document templates"
on public.document_templates for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage import templates"
on public.import_templates for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage import batches"
on public.import_batches for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage large order preparations"
on public.large_order_preparations for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage large order lines"
on public.large_order_lines for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

-- Storage paths should remain tenant-scoped:
-- artwork/{tenant_slug}/{quote_number}/...
-- labels/{tenant_slug}/{label_code}/v{version}/...
-- documents/{tenant_slug}/{document_type}/{document_number}/v{version}.pdf
-- imports/{tenant_slug}/{import_type}/{batch_id}/source.csv

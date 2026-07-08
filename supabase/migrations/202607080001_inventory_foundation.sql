-- ForgeOS inventory foundation ledger (canonical stock model).
-- Complements legacy inventory_items / stock_movements without replacing them.

create table if not exists public.inv_item_masters (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  internal_reference text not null,
  item_type text not null,
  name text not null,
  description text not null default '',
  base_unit_code text not null default 'unit',
  sku text,
  barcode text,
  lot_tracking_policy text not null default 'optional',
  minimum_stock numeric(14, 4) not null default 0,
  preferred_stock numeric(14, 4) not null default 0,
  default_location_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, internal_reference)
);

create table if not exists public.inv_stock_locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  parent_location_id uuid references public.inv_stock_locations(id) on delete set null,
  code text not null,
  name text not null,
  location_type text not null default 'shelf',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists public.inv_lots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  item_id uuid not null references public.inv_item_masters(id) on delete cascade,
  internal_lot_number text not null,
  supplier_lot text,
  quality_status text not null default 'approved',
  expiry_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, internal_lot_number)
);

create table if not exists public.inv_transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  transaction_type text not null,
  status text not null default 'posted',
  occurred_at timestamptz not null,
  posted_at timestamptz,
  operator_id text not null,
  source_document_type text,
  source_document_id text,
  reason_code text not null,
  notes text not null default '',
  idempotency_key text not null,
  reversal_of_transaction_id uuid references public.inv_transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, idempotency_key)
);

create table if not exists public.inv_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  transaction_id uuid not null references public.inv_transactions(id) on delete cascade,
  entry_sequence integer not null,
  item_id uuid not null references public.inv_item_masters(id) on delete restrict,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  location_id uuid not null references public.inv_stock_locations(id) on delete restrict,
  lot_id uuid references public.inv_lots(id) on delete set null,
  stock_condition text not null default 'available',
  quantity_delta numeric(14, 4) not null,
  base_quantity_delta numeric(14, 4) not null,
  unit_code text not null default 'unit',
  item_reference_snapshot text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.inv_reservations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  item_id uuid not null references public.inv_item_masters(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  location_id uuid references public.inv_stock_locations(id) on delete set null,
  lot_id uuid references public.inv_lots(id) on delete set null,
  quantity numeric(14, 4) not null check (quantity > 0),
  base_quantity numeric(14, 4) not null check (base_quantity > 0),
  unit_code text not null default 'unit',
  status text not null default 'active',
  source_document_type text not null,
  source_document_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inv_activity_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  activity_type text not null,
  entity_type text not null,
  entity_id text not null,
  operator_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists inv_item_masters_tenant_active_idx
  on public.inv_item_masters (tenant_id, active);

create index if not exists inv_ledger_entries_tenant_item_idx
  on public.inv_ledger_entries (tenant_id, item_id, created_at desc);

create index if not exists inv_ledger_entries_tenant_location_idx
  on public.inv_ledger_entries (tenant_id, location_id, created_at desc);

create index if not exists inv_transactions_tenant_occurred_idx
  on public.inv_transactions (tenant_id, occurred_at desc);

create index if not exists inv_reservations_tenant_status_idx
  on public.inv_reservations (tenant_id, status);

alter table public.inv_item_masters enable row level security;
alter table public.inv_stock_locations enable row level security;
alter table public.inv_lots enable row level security;
alter table public.inv_transactions enable row level security;
alter table public.inv_ledger_entries enable row level security;
alter table public.inv_reservations enable row level security;
alter table public.inv_activity_log enable row level security;

create policy "tenant members can manage inv item masters"
on public.inv_item_masters for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage inv stock locations"
on public.inv_stock_locations for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage inv lots"
on public.inv_lots for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage inv transactions"
on public.inv_transactions for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage inv ledger entries"
on public.inv_ledger_entries for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage inv reservations"
on public.inv_reservations for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage inv activity log"
on public.inv_activity_log for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

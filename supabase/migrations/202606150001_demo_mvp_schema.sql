-- ForgeOS JH Gomes demo MVP schema.
-- This schema is tenant-scoped from day one and avoids real private business data.

create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  default_locale text not null default 'pt-PT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key,
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  sku text not null,
  category text not null,
  image_url text,
  material text not null,
  capacity text not null,
  color text not null,
  units_per_box integer not null check (units_per_box > 0),
  stacks_per_box integer not null check (stacks_per_box > 0),
  units_per_stack integer not null check (units_per_stack > 0),
  compatible_lids_accessories text[] not null default '{}',
  base_price numeric(12, 4) not null check (base_price >= 0),
  personalization_available boolean not null default false,
  print_area text not null,
  setup_cost numeric(12, 2) not null default 0,
  screen_cost numeric(12, 2) not null default 0,
  lead_time_days integer not null default 0,
  source_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, sku)
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  company_name text not null,
  contact_name text not null,
  email text,
  phone text,
  status text not null default 'new',
  source text not null default 'manual',
  requested_product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete cascade,
  title text not null,
  status text not null default 'open',
  estimated_value numeric(12, 2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  product_id uuid not null references public.products(id) on delete restrict,
  quote_number text not null,
  quantity integer not null check (quantity > 0),
  print_color_count integer not null default 1 check (print_color_count > 0),
  artwork_url text,
  artwork_status text not null default 'missing',
  status text not null default 'draft',
  product_cost numeric(12, 2) not null default 0,
  setup_cost numeric(12, 2) not null default 0,
  screen_cost numeric(12, 2) not null default 0,
  ink_cost numeric(12, 2) not null default 0,
  personalization_cost numeric(12, 2) not null default 0,
  subtotal numeric(12, 2) not null default 0,
  vat numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  sent_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, quote_number)
);

create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  type text not null,
  compatible_product_categories text[] not null default '{}',
  production_speed_per_hour integer not null default 0,
  loading_bay_capacity integer not null default 0,
  status text not null default 'available',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.production_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete set null,
  product_id uuid not null references public.products(id) on delete restrict,
  machine_id uuid references public.machines(id) on delete set null,
  order_number text not null,
  customer_name text not null,
  quantity integer not null check (quantity > 0),
  status text not null default 'scheduled',
  scheduled_date date,
  artwork_status text not null default 'pending',
  screen_status text not null default 'pending',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  operator_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, order_number)
);

create table if not exists public.job_cards (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  production_order_id uuid not null references public.production_orders(id) on delete cascade,
  predicted_ink_kg numeric(10, 2) not null default 0,
  stack_loading_info text not null,
  loading_bay_capacity integer not null default 0,
  logo_preview_url text,
  package_label_placeholder text not null default 'Label/sticker placeholder',
  qr_ready_job_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, production_order_id)
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  sku text not null,
  quantity_on_hand numeric(12, 2) not null default 0,
  reserved_quantity numeric(12, 2) not null default 0,
  reorder_point numeric(12, 2) not null default 0,
  unit text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, sku)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  production_order_id uuid references public.production_orders(id) on delete set null,
  movement_type text not null,
  quantity numeric(12, 2) not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source text not null default 'website',
  company_name text not null,
  contact_name text not null,
  email text not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 0,
  message text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_type text not null,
  locale text not null,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_type text not null,
  destination text not null default 'n8n',
  status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.copilot_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  action_key text not null,
  prompt text not null,
  description text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, action_key)
);

create index if not exists leads_tenant_status_idx on public.leads (tenant_id, status);
create index if not exists quotes_tenant_status_idx on public.quotes (tenant_id, status);
create index if not exists production_orders_tenant_status_idx on public.production_orders (tenant_id, status);
create index if not exists inventory_items_tenant_sku_idx on public.inventory_items (tenant_id, sku);
create index if not exists webhook_events_tenant_status_idx on public.webhook_events (tenant_id, status);

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.products enable row level security;
alter table public.leads enable row level security;
alter table public.customers enable row level security;
alter table public.opportunities enable row level security;
alter table public.quotes enable row level security;
alter table public.machines enable row level security;
alter table public.production_orders enable row level security;
alter table public.job_cards enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.quote_requests enable row level security;
alter table public.email_templates enable row level security;
alter table public.webhook_events enable row level security;
alter table public.copilot_actions enable row level security;

create or replace function public.current_user_tenant_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select tenant_id
  from public.tenant_memberships
  where user_id = auth.uid()
$$;

create policy "tenant members can read tenants"
on public.tenants for select
using (id in (select public.current_user_tenant_ids()));

create policy "users can read own profile"
on public.profiles for select
using (id = auth.uid());

create policy "tenant members can read memberships"
on public.tenant_memberships for select
using (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can read products"
on public.products for select
using (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage products"
on public.products for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage leads"
on public.leads for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage customers"
on public.customers for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage opportunities"
on public.opportunities for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage quotes"
on public.quotes for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage machines"
on public.machines for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage production orders"
on public.production_orders for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage job cards"
on public.job_cards for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage inventory"
on public.inventory_items for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage stock movements"
on public.stock_movements for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage quote requests"
on public.quote_requests for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage email templates"
on public.email_templates for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage webhook events"
on public.webhook_events for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage copilot actions"
on public.copilot_actions for all
using (tenant_id in (select public.current_user_tenant_ids()))
with check (tenant_id in (select public.current_user_tenant_ids()));

-- Create Supabase Storage buckets manually or through seed tooling:
-- insert into storage.buckets (id, name, public) values ('artwork', 'artwork', false);
-- Store quote artwork under: artwork/{tenant_slug}/{quote_number}/original-file

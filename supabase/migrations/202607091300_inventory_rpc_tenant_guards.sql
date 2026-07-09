-- Guard inventory runtime RPCs for authenticated callers while preserving service-role access.

create or replace function public.assert_authenticated_tenant_access(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and p_tenant_id not in (select public.current_user_tenant_ids()) then
    raise exception 'tenant access denied';
  end if;
end;
$$;

create or replace function public.inv_post_stock_movement(
  p_tenant_id uuid,
  p_operator_id text,
  p_idempotency_key text,
  p_movement_kind text,
  p_item_id uuid,
  p_warehouse_id uuid,
  p_location_id uuid,
  p_quantity numeric,
  p_unit_code text default 'unit',
  p_stock_condition text default 'available',
  p_destination_location_id uuid default null,
  p_destination_stock_condition text default 'available',
  p_lot_id uuid default null,
  p_reason_code text default 'mobile',
  p_notes text default '',
  p_allow_negative boolean default false,
  p_override_reason text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.inv_transactions%rowtype;
  v_transaction_id uuid;
  v_transaction_type text;
  v_source_document_type text;
  v_item_ref text;
  v_available numeric;
  v_seq integer := 0;
  v_activity_type text;
begin
  perform public.assert_authenticated_tenant_access(p_tenant_id);

  if p_tenant_id is null or p_operator_id is null or p_idempotency_key is null then
    raise exception 'tenant, operator, and idempotency key are required';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'quantity must be positive';
  end if;

  select * into v_existing
    from public.inv_transactions
   where tenant_id = p_tenant_id
     and idempotency_key = p_idempotency_key
   limit 1;

  if found then
    return jsonb_build_object(
      'idempotent', true,
      'transaction_id', v_existing.id,
      'idempotency_key', v_existing.idempotency_key
    );
  end if;

  select internal_reference into v_item_ref
    from public.inv_item_masters
   where id = p_item_id
     and tenant_id = p_tenant_id
     and active = true;

  if v_item_ref is null then
    raise exception 'inventory item not found';
  end if;

  if not exists (
    select 1 from public.inv_stock_locations
     where id = p_location_id and tenant_id = p_tenant_id and active = true
  ) then
    raise exception 'stock location not found';
  end if;

  if not exists (
    select 1 from public.warehouses
     where id = p_warehouse_id and tenant_id = p_tenant_id
  ) then
    raise exception 'warehouse not found';
  end if;

  case p_movement_kind
    when 'receipt' then
      v_transaction_type := 'receipt';
      v_source_document_type := 'receipt';
      v_activity_type := 'receipt.posted';
    when 'issue' then
      v_transaction_type := 'adjustment_decrease';
      v_source_document_type := 'issue';
      v_activity_type := 'inventory.adjusted';
      v_available := public.inv_available_quantity(p_tenant_id, p_item_id, p_location_id, p_stock_condition);
      if not p_allow_negative and v_available < p_quantity then
        raise exception 'insufficient available stock';
      end if;
      if p_allow_negative and coalesce(nullif(trim(p_override_reason), ''), '') = '' then
        raise exception 'negative stock override requires a reason';
      end if;
    when 'transfer' then
      v_transaction_type := 'location_transfer';
      v_source_document_type := 'transfer';
      v_activity_type := 'inventory.transferred';
      if p_destination_location_id is null then
        raise exception 'destination location is required for transfer';
      end if;
      if p_destination_location_id = p_location_id then
        raise exception 'transfer source and destination must differ';
      end if;
      if not exists (
        select 1 from public.inv_stock_locations
         where id = p_destination_location_id and tenant_id = p_tenant_id and active = true
      ) then
        raise exception 'destination location not found';
      end if;
      v_available := public.inv_available_quantity(p_tenant_id, p_item_id, p_location_id, p_stock_condition);
      if not p_allow_negative and v_available < p_quantity then
        raise exception 'insufficient available stock';
      end if;
    when 'adjust_increase' then
      v_transaction_type := 'adjustment_increase';
      v_source_document_type := 'adjustment';
      v_activity_type := 'inventory.adjusted';
    when 'adjust_decrease' then
      v_transaction_type := 'adjustment_decrease';
      v_source_document_type := 'adjustment';
      v_activity_type := 'inventory.adjusted';
      v_available := public.inv_available_quantity(p_tenant_id, p_item_id, p_location_id, p_stock_condition);
      if not p_allow_negative and v_available < p_quantity then
        raise exception 'insufficient available stock';
      end if;
    else
      raise exception 'unsupported movement kind: %', p_movement_kind;
  end case;

  insert into public.inv_transactions (
    tenant_id,
    transaction_type,
    status,
    occurred_at,
    posted_at,
    operator_id,
    source_document_type,
    source_document_id,
    reason_code,
    notes,
    idempotency_key
  ) values (
    p_tenant_id,
    v_transaction_type,
    'posted',
    now(),
    now(),
    p_operator_id,
    v_source_document_type,
    p_idempotency_key,
    p_reason_code,
    coalesce(p_notes, ''),
    p_idempotency_key
  )
  returning id into v_transaction_id;

  if p_movement_kind in ('receipt', 'adjust_increase') then
    v_seq := v_seq + 1;
    insert into public.inv_ledger_entries (
      tenant_id, transaction_id, entry_sequence, item_id, warehouse_id, location_id,
      lot_id, stock_condition, quantity_delta, base_quantity_delta, unit_code, item_reference_snapshot
    ) values (
      p_tenant_id, v_transaction_id, v_seq, p_item_id, p_warehouse_id, p_location_id,
      p_lot_id, p_stock_condition, p_quantity, p_quantity, p_unit_code, v_item_ref
    );
  elsif p_movement_kind in ('issue', 'adjust_decrease') then
    v_seq := v_seq + 1;
    insert into public.inv_ledger_entries (
      tenant_id, transaction_id, entry_sequence, item_id, warehouse_id, location_id,
      lot_id, stock_condition, quantity_delta, base_quantity_delta, unit_code, item_reference_snapshot
    ) values (
      p_tenant_id, v_transaction_id, v_seq, p_item_id, p_warehouse_id, p_location_id,
      p_lot_id, p_stock_condition, -p_quantity, -p_quantity, p_unit_code, v_item_ref
    );
  elsif p_movement_kind = 'transfer' then
    v_seq := v_seq + 1;
    insert into public.inv_ledger_entries (
      tenant_id, transaction_id, entry_sequence, item_id, warehouse_id, location_id,
      lot_id, stock_condition, quantity_delta, base_quantity_delta, unit_code, item_reference_snapshot
    ) values (
      p_tenant_id, v_transaction_id, v_seq, p_item_id, p_warehouse_id, p_location_id,
      p_lot_id, p_stock_condition, -p_quantity, -p_quantity, p_unit_code, v_item_ref
    );
    v_seq := v_seq + 1;
    insert into public.inv_ledger_entries (
      tenant_id, transaction_id, entry_sequence, item_id, warehouse_id, location_id,
      lot_id, stock_condition, quantity_delta, base_quantity_delta, unit_code, item_reference_snapshot
    ) values (
      p_tenant_id, v_transaction_id, v_seq, p_item_id, p_warehouse_id, p_destination_location_id,
      p_lot_id, coalesce(p_destination_stock_condition, p_stock_condition), p_quantity, p_quantity, p_unit_code, v_item_ref
    );
  end if;

  perform public.inv_write_activity_log(
    p_tenant_id,
    v_activity_type,
    'inv_transaction',
    v_transaction_id::text,
    p_operator_id,
    jsonb_build_object(
      'movement_kind', p_movement_kind,
      'item_id', p_item_id,
      'location_id', p_location_id,
      'quantity', p_quantity,
      'idempotency_key', p_idempotency_key
    )
  );

  return jsonb_build_object(
    'idempotent', false,
    'transaction_id', v_transaction_id,
    'idempotency_key', p_idempotency_key
  );
end;
$$;

create or replace function public.inv_create_reservation(
  p_tenant_id uuid,
  p_operator_id text,
  p_idempotency_key text,
  p_item_id uuid,
  p_warehouse_id uuid,
  p_location_id uuid,
  p_quantity numeric,
  p_unit_code text default 'unit',
  p_source_document_type text default 'manual',
  p_source_document_id text default '',
  p_lot_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation_id uuid;
  v_available numeric;
begin
  perform public.assert_authenticated_tenant_access(p_tenant_id);

  if p_quantity <= 0 then
    raise exception 'reservation quantity must be positive';
  end if;

  select id into v_reservation_id
    from public.inv_reservations
   where tenant_id = p_tenant_id
     and source_document_type = p_source_document_type
     and source_document_id = p_source_document_id
     and status = 'active'
   limit 1;

  if v_reservation_id is not null then
    return jsonb_build_object('idempotent', true, 'reservation_id', v_reservation_id);
  end if;

  v_available := public.inv_available_quantity(p_tenant_id, p_item_id, p_location_id, 'available');
  if v_available < p_quantity then
    raise exception 'insufficient available stock for reservation';
  end if;

  insert into public.inv_reservations (
    tenant_id, item_id, warehouse_id, location_id, lot_id,
    quantity, base_quantity, unit_code, status,
    source_document_type, source_document_id
  ) values (
    p_tenant_id, p_item_id, p_warehouse_id, p_location_id, p_lot_id,
    p_quantity, p_quantity, p_unit_code, 'active',
    p_source_document_type, p_source_document_id
  )
  returning id into v_reservation_id;

  perform public.inv_write_activity_log(
    p_tenant_id,
    'reservation.created',
    'inv_reservation',
    v_reservation_id::text,
    p_operator_id,
    jsonb_build_object('item_id', p_item_id, 'quantity', p_quantity)
  );

  return jsonb_build_object('idempotent', false, 'reservation_id', v_reservation_id);
end;
$$;

create or replace function public.inv_release_reservation(
  p_tenant_id uuid,
  p_operator_id text,
  p_reservation_id uuid,
  p_status text default 'released'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.inv_reservations%rowtype;
begin
  perform public.assert_authenticated_tenant_access(p_tenant_id);

  if p_status not in ('released', 'consumed') then
    raise exception 'invalid reservation release status';
  end if;

  select * into v_row
    from public.inv_reservations
   where id = p_reservation_id
     and tenant_id = p_tenant_id
   for update;

  if not found then
    raise exception 'reservation not found';
  end if;

  if v_row.status <> 'active' then
    return jsonb_build_object('idempotent', true, 'reservation_id', p_reservation_id, 'status', v_row.status);
  end if;

  update public.inv_reservations
     set status = p_status,
         updated_at = now()
   where id = p_reservation_id;

  perform public.inv_write_activity_log(
    p_tenant_id,
    'reservation.released',
    'inv_reservation',
    p_reservation_id::text,
    p_operator_id,
    jsonb_build_object('status', p_status)
  );

  return jsonb_build_object('idempotent', false, 'reservation_id', p_reservation_id, 'status', p_status);
end;
$$;

create or replace function public.inv_link_barcode(
  p_tenant_id uuid,
  p_operator_id text,
  p_item_id uuid,
  p_scanned_value text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_normalized text;
  v_record_id uuid;
  v_duplicate uuid;
begin
  perform public.assert_authenticated_tenant_access(p_tenant_id);

  v_normalized := upper(trim(coalesce(p_scanned_value, '')));
  if v_normalized = '' then
    raise exception 'barcode value is required';
  end if;

  if not exists (
    select 1 from public.inv_item_masters
     where id = p_item_id and tenant_id = p_tenant_id and active = true
  ) then
    raise exception 'inventory item not found';
  end if;

  select id into v_duplicate
    from public.inv_barcode_records
   where tenant_id = p_tenant_id
     and normalized_value = v_normalized
     and status = 'active'
   limit 1;

  if v_duplicate is not null then
    raise exception 'barcode is already linked to an item';
  end if;

  insert into public.inv_barcode_records (
    tenant_id, item_id, value, normalized_value, status, is_primary
  ) values (
    p_tenant_id, p_item_id, trim(p_scanned_value), v_normalized, 'active', false
  )
  returning id into v_record_id;

  update public.inv_item_masters
     set barcode = coalesce(barcode, trim(p_scanned_value)),
         updated_at = now()
   where id = p_item_id
     and tenant_id = p_tenant_id;

  perform public.inv_write_activity_log(
    p_tenant_id,
    'barcode.linked',
    'inv_barcode_record',
    v_record_id::text,
    p_operator_id,
    jsonb_build_object('item_id', p_item_id, 'normalized_value', v_normalized)
  );

  return jsonb_build_object('barcode_record_id', v_record_id, 'normalized_value', v_normalized);
end;
$$;

grant execute on function public.assert_authenticated_tenant_access(uuid) to authenticated;
grant execute on function public.assert_authenticated_tenant_access(uuid) to service_role;
grant execute on function public.inv_post_stock_movement(uuid, text, text, text, uuid, uuid, uuid, numeric, text, text, uuid, text, uuid, text, text, boolean, text) to service_role;
grant execute on function public.inv_create_reservation(uuid, text, text, uuid, uuid, uuid, numeric, text, text, text, uuid) to service_role;
grant execute on function public.inv_release_reservation(uuid, text, uuid, text) to service_role;
grant execute on function public.inv_link_barcode(uuid, text, uuid, text) to service_role;

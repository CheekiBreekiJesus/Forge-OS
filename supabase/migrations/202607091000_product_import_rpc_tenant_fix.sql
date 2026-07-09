-- Allow service-role apply while preserving tenant guard for authenticated callers.

create or replace function public.apply_product_import_job(
  p_job_id uuid,
  p_idempotency_key text,
  p_operator_id text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.prod_import_jobs%rowtype;
  v_row record;
  v_ref text;
  v_name text;
  v_item_type text;
  v_unit text;
  v_barcode text;
  v_min_stock numeric;
  v_active boolean;
  v_existing_id uuid;
  v_applied integer := 0;
  v_skipped integer := 0;
  v_failed integer := 0;
  v_action text;
begin
  select * into v_job
    from public.prod_import_jobs
   where id = p_job_id
     for update;

  if not found then
    raise exception 'import job not found';
  end if;

  if auth.uid() is not null and v_job.tenant_id not in (select public.current_user_tenant_ids()) then
    raise exception 'tenant access denied';
  end if;

  if v_job.status = 'completed' and v_job.idempotency_key = p_idempotency_key then
    return coalesce(v_job.result_summary, '{}'::jsonb) || jsonb_build_object('idempotent', true);
  end if;

  if v_job.status not in ('approved', 'importing') then
    raise exception 'import job is not approved';
  end if;

  update public.prod_import_jobs
     set status = 'importing',
         updated_at = now()
   where id = p_job_id;

  select count(*) into v_skipped
    from public.prod_import_rows
   where job_id = p_job_id
     and coalesce(approved_action, proposed_action) = 'skip';

  for v_row in
    select r.*
      from public.prod_import_rows r
     where r.job_id = p_job_id
       and coalesce(r.approved_action, r.proposed_action) <> 'skip'
     order by r.source_row_number
  loop
    v_action := coalesce(v_row.approved_action, v_row.proposed_action, 'create_new');

    if v_action = 'skip' then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    v_ref := upper(trim(coalesce(v_row.normalized_values->>'internalReference', '')));
    v_name := trim(coalesce(v_row.normalized_values->>'description', v_row.normalized_values->>'name', ''));
    v_item_type := coalesce(nullif(trim(v_row.normalized_values->>'inventoryType'), ''), 'finished_good');
    v_unit := coalesce(nullif(trim(v_row.normalized_values->>'baseUnit'), ''), 'unit');
    v_barcode := nullif(trim(coalesce(v_row.normalized_values->>'barcode', v_row.normalized_values->>'ean', '')), '');
    v_min_stock := coalesce(nullif(v_row.normalized_values->>'minimumStock', ''), '0')::numeric;
    v_active := coalesce(v_row.normalized_values->>'status', 'active') <> 'inactive';

    if v_ref = '' or v_name = '' then
      v_failed := v_failed + 1;
      continue;
    end if;

    select id into v_existing_id
      from public.inv_item_masters
     where tenant_id = v_job.tenant_id
       and internal_reference = v_ref
     limit 1;

    if v_existing_id is null and v_barcode is not null then
      select id into v_existing_id
        from public.inv_item_masters
       where tenant_id = v_job.tenant_id
         and barcode = v_barcode
       limit 1;
    end if;

    if v_existing_id is not null and v_action in ('preserve_existing', 'link_source_reference') then
      update public.prod_import_rows
         set applied_item_id = v_existing_id,
             resolution_status = 'skipped',
             updated_at = now()
       where id = v_row.id;
      v_skipped := v_skipped + 1;
      continue;
    end if;

    if v_existing_id is not null and v_action in ('update_missing_only', 'use_incoming', 'manual_review', 'update') then
      update public.inv_item_masters
         set name = case when v_action in ('use_incoming', 'update') then v_name else name end,
             description = case when v_action in ('use_incoming', 'update') then coalesce(v_row.normalized_values->>'shortDescription', v_name) else description end,
             item_type = case when v_action in ('use_incoming', 'update') then v_item_type else item_type end,
             base_unit_code = case when v_action in ('use_incoming', 'update') then v_unit else base_unit_code end,
             barcode = case
               when v_action in ('use_incoming', 'update') then coalesce(v_barcode, barcode)
               when barcode is null or barcode = '' then v_barcode
               else barcode
             end,
             minimum_stock = case when v_action in ('use_incoming', 'update') then v_min_stock else minimum_stock end,
             active = case when v_action in ('use_incoming', 'update') then v_active else active end,
             sku = coalesce(sku, v_ref),
             updated_at = now()
       where id = v_existing_id
         and tenant_id = v_job.tenant_id;

      update public.prod_import_rows
         set applied_item_id = v_existing_id,
             matched_item_id = v_existing_id,
             resolution_status = 'updated',
             updated_at = now()
       where id = v_row.id;
      v_applied := v_applied + 1;
      continue;
    end if;

    if v_existing_id is not null then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    insert into public.inv_item_masters (
      tenant_id,
      internal_reference,
      item_type,
      name,
      description,
      base_unit_code,
      sku,
      barcode,
      minimum_stock,
      active
    ) values (
      v_job.tenant_id,
      v_ref,
      v_item_type,
      v_name,
      coalesce(v_row.normalized_values->>'shortDescription', v_name),
      v_unit,
      v_ref,
      v_barcode,
      v_min_stock,
      v_active
    )
    returning id into v_existing_id;

    update public.prod_import_rows
       set applied_item_id = v_existing_id,
           resolution_status = 'created',
           updated_at = now()
     where id = v_row.id;

    v_applied := v_applied + 1;
  end loop;

  insert into public.inv_activity_log (
    tenant_id,
    activity_type,
    entity_type,
    entity_id,
    operator_id,
    metadata
  ) values (
    v_job.tenant_id,
    'product_import_completed',
    'prod_import_job',
    p_job_id::text,
    coalesce(nullif(p_operator_id, ''), v_job.operator_id, 'system'),
    jsonb_build_object(
      'applied_rows', v_applied,
      'skipped_rows', v_skipped,
      'failed_rows', v_failed,
      'filename', v_job.filename
    )
  );

  update public.prod_import_jobs
     set status = 'completed',
         applied_rows = v_applied,
         skipped_rows = v_skipped,
         failed_rows = v_failed,
         completed_at = now(),
         updated_at = now(),
         result_summary = jsonb_build_object(
           'applied_rows', v_applied,
           'skipped_rows', v_skipped,
           'failed_rows', v_failed,
           'idempotency_key', p_idempotency_key
         )
   where id = p_job_id;

  return jsonb_build_object(
    'applied_rows', v_applied,
    'skipped_rows', v_skipped,
    'failed_rows', v_failed
  );
exception
  when others then
    update public.prod_import_jobs
       set status = 'failed',
           error_message = sqlerrm,
           updated_at = now()
     where id = p_job_id;
    raise;
end;
$$;

grant execute on function public.apply_product_import_job(uuid, text, text) to authenticated;
grant execute on function public.apply_product_import_job(uuid, text, text) to service_role;

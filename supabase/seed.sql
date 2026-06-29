-- ForgeOS JH Gomes synthetic demo seed data.
-- Emails use .invalid domains and do not represent private customer data.

insert into public.tenants (id, name, slug, default_locale)
values ('11111111-1111-1111-1111-111111111111', 'JH Gomes', 'jh-gomes', 'pt-PT')
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  default_locale = excluded.default_locale;

insert into public.products (
  id,
  tenant_id,
  name,
  sku,
  category,
  image_url,
  material,
  capacity,
  color,
  units_per_box,
  stacks_per_box,
  units_per_stack,
  compatible_lids_accessories,
  base_price,
  personalization_available,
  print_area,
  setup_cost,
  screen_cost,
  lead_time_days,
  source_url
)
values
  ('20000000-0000-0000-0000-000000000250', '11111111-1111-1111-1111-111111111111', 'Personalized PP Cup 250 ml', 'JHG-CUP-PP-250', 'personalized-cups', '/demo/products/pp-cup-250.svg', 'Polypropylene', '250 ml', 'Transparent', 1000, 20, 50, array['Flat lid 250 ml', 'Cup sleeve'], 0.0450, true, '60 x 45 mm', 35, 28, 7, null),
  ('20000000-0000-0000-0000-000000000330', '11111111-1111-1111-1111-111111111111', 'Personalized PP Cup 330 ml', 'JHG-CUP-PP-330', 'personalized-cups', '/demo/products/pp-cup-330.svg', 'Polypropylene', '330 ml', 'Transparent', 1000, 20, 50, array['Flat lid 330 ml', 'Dome lid 330 ml'], 0.0520, true, '70 x 55 mm', 35, 28, 7, null),
  ('20000000-0000-0000-0000-000000000500', '11111111-1111-1111-1111-111111111111', 'Personalized PP Cup 500 ml', 'JHG-CUP-PP-500', 'personalized-cups', '/demo/products/pp-cup-500.svg', 'Polypropylene', '500 ml', 'Transparent', 800, 16, 50, array['Flat lid 500 ml', 'Dome lid 500 ml'], 0.0710, true, '85 x 65 mm', 45, 32, 9, null),
  ('20000000-0000-0000-0000-000000001250', '11111111-1111-1111-1111-111111111111', 'Paper Cup 250 ml', 'JHG-CUP-PAPER-250', 'paper-cups', '/demo/products/paper-cup-250.svg', 'Paperboard', '250 ml', 'White', 1000, 20, 50, array['Paper cup lid 80 mm'], 0.0630, true, 'Wrap band', 50, 0, 12, null),
  ('20000000-0000-0000-0000-000000001400', '11111111-1111-1111-1111-111111111111', 'Reusable Event Cup 400 ml', 'JHG-CUP-REUSE-400', 'reusable-cups', '/demo/products/reusable-cup-400.svg', 'Reusable PP', '400 ml', 'Frosted', 500, 10, 50, array['Cup lanyard', 'Return crate'], 0.1800, true, '75 x 60 mm', 45, 32, 10, null),
  ('20000000-0000-0000-0000-000000002000', '11111111-1111-1111-1111-111111111111', 'Takeaway Packaging Box', 'JHG-PACK-BOX-M', 'takeaway-packaging', '/demo/products/takeaway-box.svg', 'Kraft board', 'Medium', 'Natural', 300, 6, 50, array['Paper bag M'], 0.1600, false, 'Label only', 0, 0, 3, null),
  ('20000000-0000-0000-0000-000000003000', '11111111-1111-1111-1111-111111111111', 'Kraft Paper Bag M', 'JHG-BAG-KRAFT-M', 'bags', '/demo/products/kraft-bag-m.svg', 'Kraft paper', 'Medium', 'Natural', 250, 5, 50, array['Takeaway box M'], 0.1100, true, '90 x 70 mm', 40, 25, 8, null),
  ('20000000-0000-0000-0000-000000004000', '11111111-1111-1111-1111-111111111111', 'Flat Lid 330 ml', 'JHG-LID-330-FLAT', 'lids', '/demo/products/lid-330-flat.svg', 'PET', '330 ml', 'Clear', 1000, 20, 50, array['Personalized PP Cup 330 ml'], 0.0260, false, 'Not available', 0, 0, 3, null),
  ('20000000-0000-0000-0000-000000005000', '11111111-1111-1111-1111-111111111111', 'Cup Sleeve', 'JHG-ACC-SLEEVE', 'accessories', '/demo/products/cup-sleeve.svg', 'Cardboard', 'Universal', 'Natural', 1000, 20, 50, array['250 ml cups', '330 ml cups', '500 ml cups'], 0.0190, true, '80 x 35 mm', 30, 20, 6, null)
on conflict (tenant_id, sku) do update set
  name = excluded.name,
  category = excluded.category,
  image_url = excluded.image_url,
  material = excluded.material,
  capacity = excluded.capacity,
  color = excluded.color,
  units_per_box = excluded.units_per_box,
  stacks_per_box = excluded.stacks_per_box,
  units_per_stack = excluded.units_per_stack,
  compatible_lids_accessories = excluded.compatible_lids_accessories,
  base_price = excluded.base_price,
  personalization_available = excluded.personalization_available,
  print_area = excluded.print_area,
  setup_cost = excluded.setup_cost,
  screen_cost = excluded.screen_cost,
  lead_time_days = excluded.lead_time_days,
  source_url = excluded.source_url;

insert into public.leads (id, tenant_id, company_name, contact_name, email, status, source, requested_product_id, quantity, notes)
values
  ('30000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Atlantic Events Demo', 'Marta Silva', 'marta.silva@example.invalid', 'quoted', 'website', '20000000-0000-0000-0000-000000000330', 12000, 'Two-color logo for summer event cups.'),
  ('30000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Cafe Ribeira Demo', 'Tiago Costa', 'tiago.costa@example.invalid', 'qualified', 'manual', '20000000-0000-0000-0000-000000001250', 5000, 'Needs quote this week.'),
  ('30000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Market Booth Demo', 'Ines Almeida', 'ines.almeida@example.invalid', 'converted', 'email', '20000000-0000-0000-0000-000000003000', 2500, 'Asked for bag personalization.')
on conflict (id) do update set status = excluded.status, notes = excluded.notes;

insert into public.customers (id, tenant_id, lead_id, company_name, contact_name, email, notes)
values ('31000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '30000000-0000-0000-0000-000000000003', 'Market Booth Demo', 'Ines Almeida', 'ines.almeida@example.invalid', 'Converted from approved demo quote.')
on conflict (id) do update set notes = excluded.notes;

insert into public.opportunities (id, tenant_id, lead_id, customer_id, title, status, estimated_value, notes)
values ('32000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '30000000-0000-0000-0000-000000000003', '31000000-0000-0000-0000-000000000003', 'Kraft bag personalization', 'won', 418.20, 'Approved demo opportunity.')
on conflict (id) do update set status = excluded.status, estimated_value = excluded.estimated_value;

insert into public.quotes (
  id, tenant_id, lead_id, customer_id, product_id, quote_number, quantity, print_color_count,
  artwork_url, artwork_status, status, product_cost, setup_cost, screen_cost, ink_cost,
  personalization_cost, subtotal, vat, total, sent_at, approved_at
)
values
  ('40000000-0000-0000-0000-000000001007', '11111111-1111-1111-1111-111111111111', '30000000-0000-0000-0000-000000000001', null, '20000000-0000-0000-0000-000000000330', 'Q-1007', 12000, 2, 'artwork/jh-gomes/Q-1007/demo-logo.svg', 'received', 'sent', 624, 35, 56, 24, 144, 883, 203.09, 1086.09, now(), null),
  ('40000000-0000-0000-0000-000000001008', '11111111-1111-1111-1111-111111111111', '30000000-0000-0000-0000-000000000002', null, '20000000-0000-0000-0000-000000001250', 'Q-1008', 5000, 1, null, 'missing', 'draft', 315, 50, 0, 12, 30, 407, 93.61, 500.61, null, null),
  ('40000000-0000-0000-0000-000000001009', '11111111-1111-1111-1111-111111111111', '30000000-0000-0000-0000-000000000003', '31000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000003000', 'Q-1009', 2500, 1, 'artwork/jh-gomes/Q-1009/demo-bag-logo.svg', 'approved', 'approved', 275, 40, 25, 12, 15, 367, 84.41, 451.41, now(), now())
on conflict (tenant_id, quote_number) do update set status = excluded.status, total = excluded.total;

insert into public.machines (id, tenant_id, name, type, compatible_product_categories, production_speed_per_hour, loading_bay_capacity, status)
values
  ('50000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'UV Screen Line 01', 'UV screen printing', array['personalized-cups', 'reusable-cups'], 2500, 500, 'scheduled'),
  ('50000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Bag Screen Station', 'Flat screen printing', array['bags', 'accessories'], 900, 250, 'available')
on conflict (id) do update set status = excluded.status;

insert into public.production_orders (id, tenant_id, quote_id, product_id, machine_id, order_number, customer_name, quantity, status, scheduled_date, artwork_status, screen_status, progress, operator_notes)
values
  ('60000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '40000000-0000-0000-0000-000000001009', '20000000-0000-0000-0000-000000003000', '50000000-0000-0000-0000-000000000002', 'PO-240615-01', 'Market Booth Demo', 2500, 'scheduled', '2026-06-15', 'approved', 'ready', 0, 'Use one-color black print. Confirm carton labels before packing.'),
  ('60000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '40000000-0000-0000-0000-000000001007', '20000000-0000-0000-0000-000000000330', '50000000-0000-0000-0000-000000000001', 'PO-240615-02', 'Atlantic Events Demo', 12000, 'blocked', '2026-06-15', 'pending', 'pending', 0, 'Waiting for final vector logo approval.')
on conflict (tenant_id, order_number) do update set status = excluded.status, progress = excluded.progress;

insert into public.job_cards (id, tenant_id, production_order_id, predicted_ink_kg, stack_loading_info, loading_bay_capacity, logo_preview_url, package_label_placeholder, qr_ready_job_url)
values
  ('61000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '60000000-0000-0000-0000-000000000001', 0.45, '50 stacks / 10 boxes', 250, 'artwork/jh-gomes/Q-1009/demo-bag-logo.svg', 'Label/sticker placeholder', '/jobs/PO-240615-01'),
  ('61000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '60000000-0000-0000-0000-000000000002', 2.16, '240 stacks / 12 boxes', 500, 'artwork/jh-gomes/Q-1007/demo-logo.svg', 'Label/sticker placeholder', '/jobs/PO-240615-02')
on conflict (tenant_id, production_order_id) do update set predicted_ink_kg = excluded.predicted_ink_kg;

insert into public.inventory_items (id, tenant_id, name, sku, quantity_on_hand, reserved_quantity, reorder_point, unit)
values
  ('70000000-0000-0000-0000-000000000330', '11111111-1111-1111-1111-111111111111', 'PP cups 330 ml clear', 'STOCK-PP-330-CLEAR', 18000, 12000, 10000, 'un'),
  ('70000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Kraft paper bag M', 'STOCK-BAG-KRAFT-M', 3200, 2500, 2000, 'un'),
  ('70000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Black UV ink', 'INK-UV-BLACK', 4, 1, 5, 'kg')
on conflict (tenant_id, sku) do update set quantity_on_hand = excluded.quantity_on_hand, reserved_quantity = excluded.reserved_quantity;

insert into public.stock_movements (tenant_id, inventory_item_id, production_order_id, movement_type, quantity, notes)
values
  ('11111111-1111-1111-1111-111111111111', '70000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000001', 'reservation', 2500, 'Reserved for PO-240615-01'),
  ('11111111-1111-1111-1111-111111111111', '70000000-0000-0000-0000-000000000330', '60000000-0000-0000-0000-000000000002', 'reservation', 12000, 'Reserved for PO-240615-02');

insert into public.quote_requests (id, tenant_id, source, company_name, contact_name, email, product_id, quantity, message)
values ('80000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'website', 'Atlantic Events Demo', 'Marta Silva', 'marta.silva@example.invalid', '20000000-0000-0000-0000-000000000330', 12000, 'Need branded cups for a summer event.')
on conflict (id) do update set message = excluded.message;

insert into public.email_templates (tenant_id, event_type, locale, subject, body)
values
  ('11111111-1111-1111-1111-111111111111', 'quote_created', 'pt-PT', 'O seu orcamento ForgeOS esta pronto', 'Ola {{contactName}}, preparámos o orcamento {{quoteId}} para {{companyName}}.'),
  ('11111111-1111-1111-1111-111111111111', 'quote_approved', 'pt-PT', 'Orcamento aprovado e enviado para producao', 'O orcamento {{quoteId}} foi aprovado e a ordem de producao sera criada.'),
  ('11111111-1111-1111-1111-111111111111', 'quote_created', 'en', 'Your ForgeOS quote is ready', 'Hi {{contactName}}, quote {{quoteId}} is ready for {{companyName}}.');

insert into public.webhook_events (tenant_id, event_type, destination, status, payload, created_at)
values
  ('11111111-1111-1111-1111-111111111111', 'lead_created', 'n8n', 'queued', '{"leadId":"lead_atlantic_events","companyName":"Atlantic Events Demo","source":"website"}'::jsonb, '2026-06-15T08:25:05.000Z'),
  ('11111111-1111-1111-1111-111111111111', 'quote_created', 'n8n', 'queued', '{"quoteId":"quote_1008","leadId":"lead_cafe_ribeira","total":448.95}'::jsonb, '2026-06-15T09:10:05.000Z'),
  ('11111111-1111-1111-1111-111111111111', 'quote_approved', 'n8n', 'queued', '{"quoteId":"quote_1009","productionOrderId":"po_240615_01"}'::jsonb, '2026-06-15T10:40:05.000Z'),
  ('11111111-1111-1111-1111-111111111111', 'production_started', 'n8n', 'queued', '{"productionOrderId":"po_demo_quote_demo_live"}'::jsonb, '2026-06-15T12:00:00.000Z'),
  ('11111111-1111-1111-1111-111111111111', 'production_completed', 'n8n', 'queued', '{"productionOrderId":"po_demo_quote_demo_live","progress":100}'::jsonb, '2026-06-15T12:30:00.000Z');

insert into public.copilot_actions (tenant_id, action_key, prompt, description)
values
  ('11111111-1111-1111-1111-111111111111', 'summarize-dashboard', 'Summarize today''s operation.', 'Summarize leads, quotes, production orders, and inventory alerts.'),
  ('11111111-1111-1111-1111-111111111111', 'find-blockers', 'What is blocking production?', 'Find production orders with pending artwork, pending screens, or blocked status.'),
  ('11111111-1111-1111-1111-111111111111', 'prepare-production', 'Prepare the next production job.', 'Suggest machine and setup context for the next job.'),
  ('11111111-1111-1111-1111-111111111111', 'inventory-risk', 'Which inventory items need attention?', 'List inventory items below available threshold.')
on conflict (tenant_id, action_key) do update set prompt = excluded.prompt, description = excluded.description;

insert into public.article_process_types (tenant_id, process_key, name, description)
values
  ('11111111-1111-1111-1111-111111111111', 'direct-sale', 'Type 1 - Direct sale', 'Purchased article sold without internal preparation.'),
  ('11111111-1111-1111-1111-111111111111', 'label-application', 'Type 2 - Label application', 'Apply customer or regulatory label before dispatch.'),
  ('11111111-1111-1111-1111-111111111111', 'repacking-labelling', 'Type 3 - Repacking and labelling', 'Split, repack, label, and prepare boxes or pallets.'),
  ('11111111-1111-1111-1111-111111111111', 'internal-production', 'Type 4 - Internal production or customization', 'Produce or customize internally using machines and routings.')
on conflict (tenant_id, process_key) do update set name = excluded.name, description = excluded.description;

insert into public.suppliers (id, tenant_id, name, email, notes)
values
  ('90000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Demo Plastics Supplier', 'plastics@example.invalid', 'Synthetic supplier for demo cup stock.'),
  ('90000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Demo Packaging Supplier', 'packaging@example.invalid', 'Synthetic supplier for demo bags and packaging.')
on conflict (tenant_id, name) do update set notes = excluded.notes;

insert into public.warehouses (id, tenant_id, code, name)
values ('91000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'WH-MAIN', 'Main warehouse')
on conflict (tenant_id, code) do update set name = excluded.name;

insert into public.warehouse_locations (id, tenant_id, warehouse_id, code, name)
values
  ('92000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '91000000-0000-0000-0000-000000000001', 'WH-A-CUPS-01', 'Cup stock aisle A'),
  ('92000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '91000000-0000-0000-0000-000000000001', 'WH-B-BAGS-02', 'Bag stock aisle B'),
  ('92000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '91000000-0000-0000-0000-000000000001', 'WH-L-LABEL-01', 'Label storage')
on conflict (tenant_id, code) do update set name = excluded.name;

update public.products
set
  product_code = sku,
  designation = name,
  family = case
    when category like '%cup%' then 'Cups'
    when category = 'bags' then 'Bags'
    else 'Food packaging'
  end,
  supplier_id = case
    when category like '%cup%' then '90000000-0000-0000-0000-000000000001'::uuid
    else '90000000-0000-0000-0000-000000000002'::uuid
  end,
  purchase_unit = 'box',
  sales_unit = 'unit',
  quantity_per_package = units_per_stack,
  quantity_per_pallet = units_per_box * stacks_per_box,
  purchase_price = base_price * units_per_box * 0.72,
  sale_price = base_price,
  minimum_stock = 1000,
  barcode = '5600000000000',
  qr_code = 'forgeos://jh-gomes/products/' || sku,
  lifecycle_status = 'active',
  process_type_key = case
    when category in ('personalized-cups', 'paper-cups', 'reusable-cups') then 'internal-production'
    when category = 'bags' then 'label-application'
    else 'direct-sale'
  end,
  preparation_instructions = 'Demo operational instructions. Replace with validated JH Gomes process data.'
where tenant_id = '11111111-1111-1111-1111-111111111111';

insert into public.labels_packaging (id, tenant_id, code, name, dimensions, file_path, printer_type, required_product_information, quantity_per_box, version)
values
  ('93000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'LBL-CUSTOMER-BOX', 'Customer box label', '100 x 70 mm', 'labels/jh-gomes/customer-box/v1.pdf', 'thermal-transfer', array['product_code', 'designation', 'quantity', 'customer_order'], 1, 1),
  ('93000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'LBL-STOCK-BOX', 'Stock box label', '80 x 50 mm', 'labels/jh-gomes/stock-box/v1.pdf', 'thermal-transfer', array['product_code', 'lot', 'quantity'], 1, 1)
on conflict (tenant_id, code, version) do update set name = excluded.name, required_product_information = excluded.required_product_information;

update public.machines
set
  identification = name,
  supported_operations = case
    when type ilike '%screen%' then array['internal-production']
    else array['label-application', 'repacking-labelling']
  end,
  manual_paths = array['manuals/jh-gomes/demo-machine.pdf'],
  standard_setup_minutes = case when type ilike '%screen%' then 45 else 20 end,
  standard_production_speed_per_hour = production_speed_per_hour,
  maintenance_status = status,
  common_defects = case
    when type ilike '%screen%' then array['ink coverage variation', 'screen registration', 'cup feed jam']
    else array['misaligned label', 'box count mismatch']
  end
where tenant_id = '11111111-1111-1111-1111-111111111111';

insert into public.quotation_rules (
  id, tenant_id, name, cup_material, cup_type, capacity, color, minimum_order_quantity,
  artwork_cost, plate_cost_per_color, packaging_cost, transport_cost, margin_rate,
  discount_rate, vat_rate, production_lead_time_days, validity_days
)
values ('94000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Clear PP personalized cups', 'Polypropylene', 'Reusable/disposable event cup', '330 ml', 'Transparent', 1000, 18, 28, 12, 35, 0.22, 0, 0.23, 7, 15)
on conflict (id) do update set name = excluded.name;

insert into public.quotation_rule_tiers (tenant_id, quotation_rule_id, minimum_quantity, unit_price, setup_cost, print_cost_per_color)
values
  ('11111111-1111-1111-1111-111111111111', '94000000-0000-0000-0000-000000000001', 1000, 0.068, 45, 18),
  ('11111111-1111-1111-1111-111111111111', '94000000-0000-0000-0000-000000000001', 5000, 0.058, 40, 14),
  ('11111111-1111-1111-1111-111111111111', '94000000-0000-0000-0000-000000000001', 10000, 0.052, 35, 12)
on conflict (tenant_id, quotation_rule_id, minimum_quantity) do update set unit_price = excluded.unit_price;

insert into public.quality_templates (id, tenant_id, workflow_type, name, version, checklist)
values
  ('95000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'setup-approval', 'Cup printer setup approval', 1, '["Artwork version matches approved quote.","Print colors match job card.","First sample approved by responsible user.","Screen status is ready."]'::jsonb),
  ('95000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'order-preparation-inspection', 'Large order final verification', 1, '["All articles picked.","Labels and packaging checked.","Package and pallet counts confirmed.","Shipping documents attached."]'::jsonb)
on conflict (tenant_id, workflow_type, version) do update set checklist = excluded.checklist;

insert into public.document_templates (id, tenant_id, template_type, name, version, required_fields)
values
  ('96000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'quotation', 'JH Gomes quotation', 1, array['quote_number', 'customer', 'items', 'vat', 'total', 'valid_until']),
  ('96000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'large-order-preparation-sheet', 'Large order preparation sheet', 1, array['order_number', 'articles', 'boxes', 'pallets', 'verification'])
on conflict (tenant_id, template_type, version) do update set required_fields = excluded.required_fields;

insert into public.import_templates (id, tenant_id, template_type, name, version, columns)
values
  ('97000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'products', 'Product master import', 1, '[{"key":"code","required":true,"example":"JHG-CUP-PP-330","validation":"Unique per tenant"},{"key":"designation","required":true,"example":"Personalized PP Cup 330 ml","validation":"Text"},{"key":"process_type","required":true,"example":"internal-production","validation":"Known process type"},{"key":"minimum_stock","required":true,"example":"10000","validation":"Number >= 0"}]'::jsonb),
  ('97000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'opening-stock', 'Opening stock import', 1, '[{"key":"item_code","required":true,"example":"STOCK-PP-330-CLEAR","validation":"Existing stock item"},{"key":"location","required":true,"example":"WH-A-CUPS-01","validation":"Existing location"},{"key":"quantity","required":true,"example":"18000","validation":"Number >= 0"},{"key":"lot","required":false,"example":"DEMO-LOT-330","validation":"Optional text"}]'::jsonb)
on conflict (tenant_id, template_type, version) do update set columns = excluded.columns;

insert into public.large_order_preparations (
  id, tenant_id, order_reference, customer_name, picking_status, preparation_progress,
  quality_confirmed, final_verified, package_count, pallet_count, notes
)
values ('98000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'AMARAL-DEMO-001', 'Amaral Demo Account', 'in-progress', 45, false, false, 18, 2, 'Synthetic large-order preparation demo record.')
on conflict (tenant_id, order_reference) do update set preparation_progress = excluded.preparation_progress;

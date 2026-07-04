# First Tenant Bootstrap

The first JH Gomes owner membership must be created through a trusted service-side SQL/bootstrap procedure. Do not commit real emails or credentials.

## Synthetic Example

```sql
insert into public.profiles (id, display_name, email)
values ('00000000-0000-0000-0000-000000000000', 'Initial Owner', 'owner@example.invalid')
on conflict (id) do update set display_name = excluded.display_name;

insert into public.tenant_memberships (tenant_id, user_id, role, status, approved_at)
select t.id, '00000000-0000-0000-0000-000000000000', 'company_owner', 'active', now()
from public.tenants t
where t.tenant_key = 'tenant_jh_gomes'
on conflict (tenant_id, user_id)
do update set role = excluded.role, status = excluded.status, approved_at = excluded.approved_at;
```

Replace synthetic IDs and emails only in private deployment operations.

# Inventory Data Safety

Inventory and product data can contain supplier references, customer-specific references, pricing, private lot data and operational stock levels. Treat it as confidential by default.

## Repository Rules

- Do not commit real customer, supplier, price, barcode, stock or lot data.
- Use synthetic fixtures only.
- Keep customer-specific mappings outside reusable platform code.
- Do not log private references, prices or contacts.
- Keep production tenant isolation server-side once persistence is connected.

## Current Preview Limitations

The current implementation is local and preview-only. It demonstrates rules and workflows but is not production authorization. Production deployment requires authenticated tenant membership checks, server-side authorization and database row-level security.


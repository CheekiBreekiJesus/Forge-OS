# ForgeOS

ForgeOS is an early MVP prototype for a multi-tenant industrial operating system for manufacturing SMEs.

The first deployment target is JH Gomes, but the platform must remain generic and tenant-aware from the beginning.

## Current Status

Implemented:

- Next.js App Router foundation
- TypeScript configuration
- Tailwind CSS styling
- ESLint configuration
- Localized routes for `pt-PT` and `en`
- Structured translation dictionaries
- Static industrial dashboard shell inspired by the ForgeOS design direction
- Placeholder modules for Dashboard, Customers, Products, Orders, Production, Inventory, Machines, Maintenance, Marketing, and Settings

Not implemented yet:

- Database
- ORM
- Authentication
- Tenant membership and authorization
- CRUD operations
- API routes or server actions
- AI provider integration
- File storage

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

- `http://localhost:3000/pt-PT`
- `http://localhost:3000/en`

The root route redirects to `pt-PT`.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Project Rules

- Internal code, routes, types, database fields, and API naming must stay in English.
- User-facing text must come from localization dictionaries.
- Supported MVP locales are `pt-PT` and `en`.
- Spanish `es` should be easy to add later, but is not translated yet.
- Do not commit secrets, private customer data, supplier records, or private business data.
- Do not hardcode JH Gomes-specific workflows into global modules.

# Cup Customizer — Customer logos

## Stored customer logo workflow

Customer logos are **not** fetched from website URLs automatically.

Lookup order:

1. Meta registry key `cup-customizer:logo:customer:{customerId}`
2. Meta registry key `cup-customizer:logo:lead:{leadId}`
3. `LocalAsset` with `assetType: "logo"`

## UI actions (explicit only)

| Action | Behaviour |
|--------|-----------|
| **Usar logótipo guardado do cliente** | Lookup registry + load asset onto cup |
| **Procurar logótipo online** | Provider boundary only; disabled when not configured |
| **Gerar logótipo** | Provider boundary only; deterministic mock in tests |

Selecting a customer or lead does **not** auto-load or search.

## Registering logos (local MVP)

```typescript
import { registerCustomerLogoAssetId } from "@/features/cup-customizer";

await registerCustomerLogoAssetId(metaRepo, customerId, localAssetId);
```

Future CRM UI can call the same registry without customizer coupling.

## Privacy

- Never use `customer.website` as an image URL
- No automatic remote fetches

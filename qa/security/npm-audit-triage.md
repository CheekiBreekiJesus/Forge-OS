# npm Audit Triage

Date: 2026-07-04  
Branch: `chore/dependency-audit-triage`  
Base commit: `cf97561` (`feat(auth): add Supabase OAuth foundation`)  
Install: `npm ci` (468 packages audited)

## Executive summary

`npm audit` reports **3 high-severity findings** across **2 packages**:

| # | Package | Advisory | Audit severity | Application risk | Fix urgency |
|---|---------|----------|----------------|------------------|-------------|
| 1 | `playwright@1.53.1` | GHSA-7mvr-c777-76hp | High | Low (dev/CI browser install only) | Medium |
| 2 | `@playwright/test@1.53.1` | GHSA-7mvr-c777-76hp (via `playwright`) | High | Low (test harness only) | Medium |
| 3 | `xlsx@0.18.5` | GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9 | High | **Elevated** (client-side parsing of user uploads) | **High** |

Audit severity and application risk diverge most for `xlsx`: it is a **production dependency** parsing **untrusted `.xlsx` uploads** in the browser. Playwright findings affect **development and CI** only and do not ship in production artifacts.

Sanitized machine output: `qa/security/npm-audit-sanitized.json`  
Raw logs (gitignored): `qa/security/tmp/`

---

## Finding 1 & 2 — Playwright SSL verification (GHSA-7mvr-c777-76hp)

### Inventory

| Field | Value |
|-------|-------|
| Advisory | [GHSA-7mvr-c777-76hp](https://github.com/advisories/GHSA-7mvr-c777-76hp) |
| CWE | CWE-347 (Improper Verification of Cryptographic Signature) |
| Installed | `playwright@1.53.1`, `@playwright/test@1.53.1` |
| Vulnerable range | `playwright` &lt; 1.55.1 |
| Direct vs transitive | `@playwright/test` **direct** (`devDependencies`); `playwright` **transitive** |
| Fixed version | `playwright` ≥ 1.55.1 (npm proposes `@playwright/test@1.61.1`) |
| Fix type | **Minor** (not semver-major) |
| npm `fixAvailable` | Yes — upgrade `@playwright/test` to 1.61.1 |
| Forced downgrade proposed | No |

### Dependency path

```
forge-os
└── @playwright/test@1.53.1  (devDependencies, pinned)
    └── playwright@1.53.1
```

### Usage classification

| Context | Used? | Evidence |
|---------|-------|----------|
| Production runtime | **No** | `devDependencies` only; not imported from `src/` app routes |
| Production bundle | **No** | No imports under `src/app/` or server components |
| Build scripts | **No** | Not invoked by `npm run build` |
| Unit tests (`vitest`) | **No** | Vitest does not depend on Playwright in this repo |
| E2E / acceptance tests | **Yes** | `e2e/**/*.spec.ts`, `playwright.config.ts`, `playwright.acceptance.config.ts` |
| CI | **Yes** | `.github/workflows/ci.yml` runs `npx playwright install chromium` and targeted e2e specs |
| Developer tooling | **Yes** | `scripts/qa/private-import-acceptance.ts` imports `chromium` from `@playwright/test` |

### Reachability

**Classification: development-only / CI-only**

The vulnerable code path executes when Playwright **downloads or installs browser binaries** (`playwright install`, first-run bootstrap). It does **not** run during `next start` or in deployed Next.js output.

### Attack prerequisites

- Attacker must perform a **network MITM** against the machine running `playwright install` or first browser download.
- Target is typically a **developer workstation** or **CI runner**, not an end user of ForgeOS.
- No ForgeOS user input reaches this code path.

### Untrusted input

**No.** End-user uploads and API payloads do not interact with Playwright.

### Production inclusion

**No.** `playwright` and `@playwright/test` are excluded from production dependency tree (`npm ls --all` shows them only under dev).

### Application risk vs audit severity

| Dimension | Assessment |
|-----------|------------|
| Audit severity | High |
| Actual application risk | **Low** — supply-chain risk during dev/CI browser provisioning |
| Fix urgency | Medium — schedule with next dev-tooling maintenance window |

### Uncertainty

Low. Dependency graph and import scan confirm no production reachability.

---

## Finding 3 — SheetJS `xlsx` (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9)

### Inventory

| Field | Value |
|-------|-------|
| Advisories | [GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6) (Prototype Pollution), [GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9) (ReDoS) |
| CWE | CWE-1321, CWE-1333 |
| CVSS | 7.8 (AV:L/UI:R) and 7.5 (AV:N, availability impact) |
| Installed | `xlsx@0.18.5` |
| Vulnerable range | Prototype pollution &lt; 0.19.3; ReDoS &lt; 0.20.2; npm reports `*` (no clean version on registry) |
| Direct vs transitive | **Direct** (`dependencies`) |
| Fixed version on npm `xlsx` | **None** — registry latest is `0.18.5` |
| Fix type | Would be **minor** if a patched `xlsx` existed; practical fixes require **replacement or alternate distribution** |
| npm `fixAvailable` | **false** |
| Forced downgrade proposed | No |

### Dependency path

```
forge-os
└── xlsx@0.18.5  (dependencies)
```

### Usage classification

| Context | Used? | Importer / path |
|---------|-------|-----------------|
| **Production client runtime** | **Yes** | `src/components/leadops-import-wizard.tsx` (`"use client"`) → `src/application/lead-import-service.ts` → `src/features/leadops/import-file-parser.ts` → `xlsx` |
| Production server runtime | No direct server import found | Parsing occurs in client bundle, not API routes |
| Build time | Yes | Bundled into client JS for `/[locale]/leadops` |
| Unit / integration tests | Yes | `import-file-parser.test.ts`, `lead-import.integration.test.ts`, `outreach-import-send-job.integration.test.ts` |
| Developer scripts | Yes | `scripts/data-preparation/profile-lead-files.mjs` (local profiling; reads files from disk) |

### Affected functionality

Lead import wizard (`/[locale]/leadops`):

- Users select `.csv` or `.xlsx` files (max **5 MB**, max **5000** data rows).
- `XLSX.read(buffer, { type: "array", cellFormula: false, cellHTML: false })` parses workbook bytes in the **browser**.
- Sheet names listed; default sheet chosen by row count; cells converted to strings for CRM lead import.

### Reachability

**Classification: reachable in production**

Evidence:

1. `xlsx` is a **production** `dependency`, not `devDependency`.
2. `leadops-import-wizard.tsx` is a client component wired into `leadops-dashboard-shell.tsx`.
3. `parseImportFile` / `listXlsxSheetNames` call `XLSX.read` on `File.arrayBuffer()` from the file picker.
4. `npm run build` succeeds with this import chain — `xlsx` is included in the client bundle for leadops.

### Attack prerequisites

| Advisory | Prerequisites |
|----------|-----------------|
| Prototype pollution (GHSA-4r6h-8v6p-xvw6) | Attacker supplies a crafted `.xlsx`; victim opens lead import and selects the file. CVSS assumes local attack vector with user interaction. In browser context, impact is mainly integrity/availability of the client session rather than server compromise. |
| ReDoS (GHSA-5pgg-2g8v-p4x9) | Attacker supplies a malicious workbook triggering pathological regex during parse. Can freeze or slow the **user's browser tab**; no server round-trip required for parse phase. |

### Untrusted input

**Yes.** Any authenticated leadops operator (or demo user with access) can upload `.xlsx` files. File type is validated by extension/MIME only; content is fully attacker-controlled within size limits.

### Existing mitigations (partial)

- `MAX_IMPORT_BYTES` = 5 MB
- `MAX_IMPORT_ROWS` = 5000
- `cellFormula: false`, `cellHTML: false` on `XLSX.read`
- Output cells normalized to strings before persistence
- `sanitizeFormulaInjection` on displayed/exported values (does not harden the parser itself)

These reduce blast radius but **do not remediate** the underlying SheetJS advisories.

### Production inclusion

**Yes.** Shipped in client bundles for lead import.

### Application risk vs audit severity

| Dimension | Assessment |
|-----------|------------|
| Audit severity | High |
| Actual application risk | **Elevated** — untrusted spreadsheets parsed client-side; ReDoS is the most plausible near-term abuse (tab DoS); prototype pollution risk is real but browser-sandboxed |
| Fix urgency | **High** — prioritize before broad production rollout of lead import |

### Uncertainty

- Exact exploit payloads for 0.18.5 were not executed in this triage (inspection-only task).
- Whether `@e965/xlsx` (community mirror at 0.20.3) is acceptable for ForgeOS requires **license and supply-chain review** (Codex).

---

## Reachability summary

| Finding | Classification | Production bundle | Untrusted input |
|---------|----------------|-------------------|-----------------|
| `playwright` GHSA-7mvr-c777-76hp | Development-only | No | No |
| `@playwright/test` GHSA-7mvr-c777-76hp | Test-only / CI | No | No |
| `xlsx` GHSA-4r6h-8v6p-xvw6 | Reachable in production | Yes (client) | Yes |
| `xlsx` GHSA-5pgg-2g8v-p4x9 | Reachable in production | Yes (client) | Yes |

---

## Baseline health (pre-remediation)

Recorded on `cf97561` before any dependency changes:

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| `npm test` | Pass — 299 passed, 3 skipped |
| `npm run build` | Pass — Next.js 16.2.9 production build |

---

## Remediation pointers

Detailed options, version targets, and agent handoff prompts are in `docs/security/dependency-remediation-plan.md`.

### Quick recommendations

| Finding | Recommended action | Owner |
|---------|-------------------|-------|
| Playwright SSL (×2 audit nodes) | Bump `@playwright/test` to `>=1.55.1` (target `1.61.1`); re-run e2e + CI browser install | **Composer** |
| `xlsx` advisories | Replace or upgrade via vetted alternate (`@e965/xlsx@0.20.3` or `exceljs`); regression-test import wizard | **Codex** (architecture + import parser) |

---

## Inspection methodology

1. `npm ci`, `npm audit --json`, `npm audit`, `npm ls --all`
2. Lockfile and `package.json` dependency classification
3. Repository grep for `xlsx`, `playwright`, `@playwright/test`
4. Import-chain tracing from UI components through application services
5. CI workflow review (`.github/workflows/ci.yml`)
6. Baseline `typecheck`, `test`, `build` without modifying dependencies

No `npm audit fix`, `npm audit fix --force`, or lockfile regeneration was performed on this branch.

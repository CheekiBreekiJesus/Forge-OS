# Node and Lockfile Repair

**Date:** 2026-07-05  
**Branch:** `integration/jh-gomes-release-candidate`

## Symptoms

GitHub Actions `npm ci` on Ubuntu failed with:

```
Missing: @emnapi/runtime@1.11.2 from lock file
Missing: @emnapi/core@1.11.2 from lock file
```

Separately, Supabase packages require Node `>=22` while workflows used Node 20.

## Root cause (lockfile)

The lockfile was generated on Windows with npm 11 without top-level entries for `@emnapi/runtime@1.11.2` and `@emnapi/core@1.11.2`. Linux `npm ci` (strict) requires every resolved package to appear in `package-lock.json`.

`@emnapi/*` is not a direct dependency. It is pulled as a **peer** of `@napi-rs/wasm-runtime@1.1.5`, which is used by Vitest/Rolldown WASM bindings (`@rolldown/binding-wasm32-wasi`, `@unrs/resolver-binding-wasm32-wasi`).

## Fix

1. Standardize on **Node 22** and **npm 10.9.8** (`node:22-bookworm`).
2. Remove `node_modules`.
3. Regenerate lockfile: `npm install --package-lock-only`
4. Verify: `npm ci`
5. Verify Linux: `docker run --rm -v $PWD:/workspace -w /workspace node:22-bookworm bash -lc "npm ci"`

## Verified versions

| Tool | Version |
|------|---------|
| Node (CI/Docker) | v22.23.1 |
| npm (lockfile) | 10.9.8 |

## Result

- `@emnapi/runtime@1.11.2` and `@emnapi/core@1.11.2` present in lockfile.
- Linux `npm ci` exit code 0 in Docker.
- No manual lockfile edits to `@emnapi` entries.

## Local Windows note

Use `npx npm@10.9.8 ci` when the host npm is 11.x to ensure `.bin` shims are created reliably on Windows.

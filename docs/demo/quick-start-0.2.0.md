# ForgeOS 0.2.0 local demo — Windows quick start

One path from clean checkout to smoke-tested local demo on Windows.

## Prerequisites

- **Git** for Windows
- **Node.js 22.x** (not 23+). Verify with `node -v` → `v22.x.x`
- **npm 10.9.8** (recommended: `corepack enable` then `corepack prepare npm@10.9.8 --activate`)

## 1. Clean checkout

```powershell
git clone <repository-url> Forge-OS
cd Forge-OS
git fetch origin
git checkout release/forgeos-0.2.0-local-demo
```

## 2. Node verification

```powershell
node -v    # must show v22.x.x
npm -v     # should show 10.9.8 when using corepack pin
```

If Node is not 22.x, install from [nodejs.org](https://nodejs.org/) LTS 22 line or use `nvm-windows` / `fnm`.

## 3. Install dependencies

```powershell
npm ci
```

For a fully clean install:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm ci
```

## 4. Demo preparation

```powershell
npm run demo:prepare
```

This asserts Node 22, runs `npm ci`, and creates `.demo/` runtime directories. Demo scripts inject environment at runtime; they do **not** modify `.env.local`.

## 5. Start the demo

```powershell
npm run demo:start
```

- URL: **http://localhost:3000/pt-PT**
- Database: `forgeos:jhgomes:0.2.0-demo`
- Login: local preview user (no OAuth)

Leave this terminal open.

## 6. Reset / reseed (new terminal)

With the server running:

```powershell
npm run demo:reset
npm run demo:seed
```

`demo:reset` clears the demo IndexedDB via headless browser. Reload the app or run `demo:seed` to confirm deterministic data.

Alternative in the UI: **Definições → Dados e cópia de segurança → Repor apenas dados demo**.

## 7. Smoke test

In a third terminal (server still running for `demo:reset`; smoke is self-contained):

```powershell
npm run demo:smoke
```

Or run the full release demo gate:

```powershell
npm run validate:release
```

`validate:release` includes lifecycle unit tests, integrated walkthrough (`test:demo-walkthrough`), and Playwright smoke on port **3002**.

## Optional: full release validation

```powershell
npm run validate:security
npm run validate:full
npm run validate:release
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `ForgeOS 0.2.0 demo requires Node.js 22.x` | Switch to Node 22 |
| Port 3000 in use | Stop other dev servers or free the port |
| Empty LeadOps after reset | Hard refresh; confirm DB name in Settings → About |
| `demo:reset` fails | Ensure `demo:start` is running first |

## References

- Operator checklist: `docs/demo/operator-checklist-0.2.0.md`
- Release notes: `docs/releases/0.2.0.md`
- Walkthrough spec: `e2e/forgeos-0.2.0-demo.spec.ts`

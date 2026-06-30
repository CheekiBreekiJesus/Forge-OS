# AI Provider Setup

Date: 2026-06-30

## Local Setup

Copy the template:

```bash
cp .env.example .env.local
```

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Set only the provider values needed for the local test. Do not commit `.env.local`.

## Abacus.AI

Default Outreach provider:

```text
AI_OUTREACH_PROVIDER=abacus
ABACUS_API_KEY=replace-with-abacus-key
ABACUS_MODEL=OPENAI_GPT5_4_MINI
ABACUS_TRANSPORT=python-bridge
ABACUS_PYTHON_BIN=python
```

Install the Python SDK locally when running live diagnostics:

```bash
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r scripts/ai/requirements.txt
```

On Unix:

```bash
python3 -m venv .venv
.venv/bin/pip install -r scripts/ai/requirements.txt
```

ForgeOS resolves Python automatically in this order when `ABACUS_PYTHON_BIN` is missing or invalid:

1. configured `ABACUS_PYTHON_BIN`
2. local `.venv`
3. `python`
4. `py`
5. `python3`

On Windows, prefer `ABACUS_PYTHON_BIN=python` or leave it unset so the local `.venv` is used.

## Model Catalog

Generate or refresh the local model catalog:

```bash
npm run ai:models -- --provider abacus
```

The command writes `config/ai/catalogs/abacus.generated.json`. If the SDK is unavailable, it writes a bundled fallback catalog and marks `sdkAvailable` as `false`.

## Diagnostics

Non-live diagnostic:

```bash
npm run ai:doctor -- --provider abacus
```

Live diagnostic with local credentials:

```bash
npm run ai:doctor -- --provider abacus --live
```

The live check uses synthetic data only. It reports whether structured output is valid and whether fallback was used.

## Model Comparison

Compare up to three live Abacus models with synthetic prompts:

```bash
npm run ai:compare -- --provider abacus --live --models OPENAI_GPT5_4_MINI,OPENAI_GPT5_MINI
```

More than three models requires:

```bash
--confirm-more-than-three
```

Comparison outputs are written under `qa/ai/` and are gitignored.

## Production Notes

- The current Abacus adapter uses a Python subprocess bridge. That is acceptable for local and server environments with Python available, but it should be reviewed before serverless deployment.
- Provider-specific native adapters are still needed for Anthropic and Google.
- Do not enable browser-side provider selection unless a future authorization model explicitly supports it.

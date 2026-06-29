# ForgeOS Local QA

Generated QA artifacts for Cursor monitoring. Not intended for Git commit unless the team explicitly tracks findings.

## Layout

- `findings/` — structured defect reports (`FORGE-QA-XXX.md`)
- `tasks/` — scoped implementation briefs for Codex
- `screenshots/` — local evidence (gitignored)

## Finding template

See any file in `findings/` for the canonical format.

## Commands

```bash
npm run dev          # local app (default http://localhost:3000)
npm run lint
npm run typecheck
npm run test
npm run build        # heavy; run sequentially, not in parallel with other checks
npm run agent:health
npm run agent:maintain
npm run agent:test
```

Agent maintenance reports are written to `qa/reports/` (gitignored except schema and `.gitkeep`).

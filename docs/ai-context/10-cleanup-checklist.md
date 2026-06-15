# 10 Cleanup Checklist

Use this checklist before committing the handover pack to GitHub.

## Sensitive Data Removal

- [ ] No passwords included.
- [ ] No API keys included.
- [ ] No tokens included.
- [ ] No private emails included.
- [ ] No phone numbers included.
- [ ] No private addresses included.
- [ ] No personal health information included.
- [ ] No irrelevant personal history included.
- [ ] No customer-sensitive data included.
- [ ] No real private supplier/customer records included.

## Contradiction Removal

- [ ] Project name is consistent.
- [ ] Repository name is consistent or clearly marked as an assumption.
- [ ] Current stage is consistently described.
- [ ] MVP scope does not conflict across files.
- [ ] Tech stack assumptions are clearly marked.
- [ ] Localization rules are consistent.
- [ ] Multi-tenant rules are consistent.

## Outdated Decision Cleanup

- [ ] Deprecated ideas are removed.
- [ ] Abandoned ideas are not included unless needed to explain a decision.
- [ ] Tentative decisions are marked as tentative.
- [ ] Assumptions are clearly marked.
- [ ] Open questions are clearly marked.

## API Key / Token Safety

- [ ] `.env` is not committed.
- [ ] `.env.example` contains placeholders only.
- [ ] No provider credentials appear in docs.
- [ ] No private URLs with tokens appear in docs.

## Customer / Private Data Safety

- [ ] JH Gomes is only included as the first deployment target.
- [ ] No private JH Gomes customer data is included.
- [ ] No private pricing lists are included.
- [ ] No private supplier communications are included.
- [ ] No private machine documents are included unless intentionally public inside the repo.

## Repo Structure Sanity

- [ ] `AGENTS.md` exists at repo root.
- [ ] `docs/ai-context/` exists.
- [ ] All AI context files are committed.
- [ ] README points to `AGENTS.md` or docs if useful.
- [ ] Docs do not reference files that do not exist unless marked as future/recommended.

## Docs Match Actual Implementation

- [ ] Tech stack documentation matches actual repo.
- [ ] Architecture notes match actual folders.
- [ ] Database notes match actual schema/migrations.
- [ ] Auth notes match actual implementation.
- [ ] i18n notes match actual localization setup.
- [ ] Build/test commands match `package.json`.
- [ ] MVP roadmap reflects the current codebase.

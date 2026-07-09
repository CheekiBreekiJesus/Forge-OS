# Product Import UI — QA Report

**Route:** `/{locale}/products/import`  
**Themes tested:** light, dark (via existing theme toggle)  
**Locales:** `en`, `pt-PT`  
**Viewports:** desktop 1440×900, tablet 1024×768, mobile 390×844 (Playwright)

## Flow coverage

| Step | Status |
| --- | --- |
| File select (CSV/XLS/XLSX) | Pass (synthetic fixture) |
| Worksheet select | Pass |
| Mapping profile | Pass |
| Preview filters | Pass |
| Duplicate/conflict display | Pass (integration) |
| Stage | Pass |
| Selected commit | Pass |
| Product persistence after reload | Pass |
| Import history | Pass |

## Console errors

None observed in E2E product-import spec with synthetic data.

## Notes

- Pagination at 25 rows per page
- Double-submit guarded with busy state
- No private data in screenshots or fixtures

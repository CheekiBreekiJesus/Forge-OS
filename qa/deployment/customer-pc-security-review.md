# Customer PC security review

Review date: 2026-07-03  
Branch: `feat/customer-pc-local-runtime`

## Scope

Windows local-runtime scripts, health endpoint, diagnostics bundle, and customer environment template.

## Checklist

| Control | Status | Evidence |
|---------|--------|----------|
| App binds only to localhost by default | Pass | Start scripts pass `-H localhost -p 3000` to Next.js |
| No Windows firewall rule added | Pass | No `netsh advfirewall` or similar in scripts |
| No port forwarding | Pass | No forwarding configuration |
| No public tunnel | Pass | No ngrok/cloudflared/localtunnel usage |
| No credentials in scripts | Pass | Scripts read `.env.local`; no embedded secrets |
| No `.env.local` output | Pass | Logs use redaction; diagnostics exclude `.env.local` |
| No browser data deletion | Pass | No IndexedDB or site-data clearing commands |
| No admin requirement | Pass | Current-user desktop shortcuts only |
| No broad process termination | Pass | `Stop-ForgeOS.ps1` stops saved PID only; no `taskkill /IM node.exe` |
| Logs are redacted | Pass | `Redact-ForgeOSText` in `ForgeOS-Runtime.psm1` |
| Diagnostics exclude sensitive files | Pass | `Collect-ForgeOS-Diagnostics.ps1` bundles summary, health, redacted logs only |
| Health endpoint non-sensitive | Pass | `GET /api/health/local` returns booleans/metadata only |
| Customer template placeholders only | Pass | `.env.customer.local.example` |
| Setup never overwrites `.env.local` | Pass | `Initialize-ForgeOSEnvLocal` |
| Update never deletes `.env.local` | Pass | `Update-ForgeOS.ps1` |
| Stable origin documented | Pass | `http://localhost:3000` in docs and scripts |
| AI/email providers disabled by default | Pass | Customer template uses `deterministic` and `simulation` |

## Residual risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Operator pastes real API keys into `.env.local` | Medium | Template uses placeholders; docs warn not to share `.env.local` |
| Another app on port 3000 | Low | Port check with process description |
| Browser site data cleared by user | Medium | Documented in PT quick start and troubleshooting |
| Fast-forward update fails on divergent history | Low | Update script requires clean tree and uses `--ff-only` |

## Conclusion

The customer PC local-runtime workflow meets the stated security constraints for a single-machine, localhost-only deployment.

# Testing, performance and accessibility results

## Automated test suites (2026-11-13, Phase 7 final run)
| Suite | Command | Result |
|---|---|---|
| Unit | `npm test` | **84 passed** |
| Integration (real PostgreSQL with RLS, rebuilt from migrations) | `npm run test:integration` | **137 passed** |
| End-to-end (Playwright, production build) | `npm run test:e2e` (server: `scripts/e2e-server.sh`) | **48 passed** |
| Lint / types | `npm run lint`, `npm run typecheck` | clean |
| Client bundle secret scan | CI step | clean |

CI (`.github/workflows/ci.yml`) runs all of the above on every push and pull request with an ephemeral Postgres 16.

### Coverage by area (highlights)
- **Tenant isolation**: RLS forced on all tenant tables; sweep over every readable tenant table; cross-tenant writes rejected; per-feature isolation tests (files, API, analytics, AI logs).
- **Integrity**: audit hash chain; course approval chain; exam attempt rules; competency signature immutability; attendance capacity under concurrency (row lock); file immutability and evidence locking after signature.
- **Security (e2e)**: nonce CSP with no browser CSP violations; HSTS/nosniff/frame denial; anonymous/forged requests to exports, files, analytics, API, cron and webhooks refused; cross-tenant URL returns 404; stored XSS rendered inert; upload download headers.
- **Content**: all 15 library courses checked for objectives, ≥5 sections, knowledge checks, ≥15 exam questions with valid answer keys, and references.

## Accessibility
Automated **axe-core** scans (WCAG 2.0/2.1/2.2 A and AA rule sets) run in `tests/e2e/phase7.spec.ts` on public, administrator and learner pages; a broader exploratory scan covered ~40 pages including course, competency, class, rule, builder, platform and audit pages.

| Initial findings (fixed) | Fix |
|---|---|
| Insufficient contrast on teal buttons, active navigation and badges (teal-600/500 with white text) | Darkened to teal-700 (≥ 4.5:1) |
| Muted helper text (slate-400) below contrast minimum | slate-500 |
| Logo link accessible name did not include its visible text | visible text + screen-reader suffix |
| Definition list with invalid children on the dashboard | restructured |
| Link inside text distinguished by color only (registration page) | underlined |

**Result after fixes: 0 axe violations** on all scanned pages. Keyboard check: skip link is the first focusable element and moves focus to main content.

Automated tools find roughly a third to a half of accessibility issues. Before launch, complete a **manual audit** with screen readers (NVDA/JAWS, VoiceOver), keyboard-only navigation of the exam and builder flows, zoom to 200–400%, and testing with users with disabilities.

## Mobile
At 390×844 (iPhone 12–15 class), learner and administrator core pages render with **no horizontal page overflow**; wide tables scroll inside their cards. A fix was applied so grid columns can shrink (`.grid > * { min-width: 0 }`). The mobile navigation bar works.

## Performance
Measured on a **2-vCPU container** running the app and PostgreSQL together (a conservative setup — production splits them), with a synthetic **5,000-employee** organization (15,000 assignments, 15,000 enrollments, 25,000 notifications; `scripts/perf/volume.ts`, data labeled DEMO-LOAD).

### Server-side operations (`scripts/perf/bench.ts`, median of 5)
| Operation | Before | After |
|---|---:|---:|
| Admin dashboard data | 22 ms | 32 ms |
| Analytics (5,000 staff, no filters) | 678 ms | 328 ms |
| Employee compliance (all 5,000) | 83 ms | 90 ms |
| Regulatory compliance (organization) | 108 ms | 104 ms |
| Report: overdue training | 72 ms | 69 ms |
| Learner: My Learning | 2 ms | 2 ms |

### HTTP load (`scripts/perf/load.ts`, autocannon, 15 s per scenario)
| Scenario | Concurrent users | Before p50 / p97.5 | After p50 / p97.5 | Req/s after | Errors after |
|---|---:|---|---|---:|---:|
| Login page | 50 | 253 / 349 ms | 238 / 320 ms | 200 | 0 |
| Learner: My Learning | 50 | 839 / 1,295 ms | 847 / 1,134 ms | 56 | 0 |
| Learner: dashboard | 50 | 647 / 1,078 ms | 623 / 1,054 ms | 76 | 0 |
| Admin dashboard (5,000 staff) | 20 | 5,333 / 5,587 ms | 1,718 / 2,037 ms | 11 | 0 |
| Admin employee list | 20 | 7,109 / 9,157 ms (10 errors) | 1,717 / 3,934 ms | 10 | 0 |
| Admin analytics (5,000 staff) | 10 | 2,310 / 7,902 ms | 652 / 3,455 ms | 11 | 0 |

**Optimizations made:** analytics queries rewritten to join an unnested population once instead of large `ANY(array)` scans and to aggregate monthly trends in one grouped pass; employee list paginated (100 per page); dashboard and analytics whole-workforce aggregates cached per viewer for 60 seconds; dashboard attention lists limited in SQL.

**Interpretation and recommendations:** learner pages — the highest-volume traffic — stay around 1 s at the 97.5th percentile under 50 concurrent users on 2 vCPUs. Administrator pages for very large organizations are CPU-bound in rendering and compliance evaluation. For production: run the database separately; scale app instances horizontally (Vercel does this automatically); for organizations above ~5,000 staff, move whole-workforce compliance to the nightly snapshot table and add a read replica for reports. Re-run `scripts/perf/*` against staging before launch.

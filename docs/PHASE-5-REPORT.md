# Phase 5 — Regulatory Compliance: Completion Report

**Project:** Complete Healthcare Innovative Training Academy
**Phase:** 5 of 7 (Florida compliance engine, federal requirements, applicability rules, compliance dashboards, audit reports)
**Date:** November 13, 2026

## 1. Completed functionality

| Spec item | Delivered |
|---|---|
| Regulatory library (§11) | **37 rules from 26 sources**, covering all 13 required categories: AHCA, Florida DOH, Board of Nursing, Board of Pharmacy, DCF, CMS, HRSA, OSHA, HHS OCR, CDC, HIPAA, Medicare & Medicaid, and 340B. Every rule stores the §11 fields: agency, citation, facility types, employee roles, training requirement, frequency, effective date, source URL, last-verified date, responsible reviewer, and compliance status. It also records the obligation type (training mandate, licensure CE, competency assessment, program requirement, guidance, or no mandate identified), the initial timing and frequency exactly as the source words them, a verification note, and any pending rulemaking. |
| Verified, not invented | 30 rules were checked against their sources on 2026-11-13: osha.gov, eCFR, the Florida Statutes site and Cornell LII copies of the CFR and F.A.C., with each copy noted. 7 rules could not be verified: Board of Nursing CE, Board of Pharmacy CE, CDC VFC, CDC infection-prevention guidance, the HRSA health center manual, DCF programs, and 340B guidance as a non-mandate. These are marked **Needs review** and state **no deadline or frequency**. The database refuses a frequency unless it is marked verified. |
| Rules engine (§11) | Decides whether a rule applies using **jurisdiction** (facility state), **facility type**, **facility license and program designations** (ALF standard, specialized dementia care, CLIA high complexity, VFC provider, 340B covered entity, Medicare Advantage organization), **employee position**, **job duties** (new on employee profiles), **clinical / bloodborne exposure**, and accreditation or organizational policy (through requirements). Not every course is treated as mandatory. Guidance and licensure CE are labelled as such, and rules with no matching staff show as "No staff in scope". |
| Organization decisions | Applicable, Not applicable or Under review, organization-wide or per facility, with a **required rationale**. Decisions are an insert-only history stamped with the rule version and decider. A decision made on an older rule version is automatically flagged **re-review**. |
| Mapping rules to training | One step turns a rule into an organization training requirement that cites it. Applicability is copied from the rule. The frequency and initial window are copied only if verified. Unverified rules are created "for review", so onboarding doesn't auto-assign them. Mapped requirements then drive onboarding, assignments, renewals and reminders from Phase 4. |
| Compliance evaluation | Per facility and per employee. An item is **Current / Due soon / Assigned / Overdue / Expired / Not assigned**, valid until the earlier of certificate expiry and completion + required frequency. Revoked certificates never satisfy an item, and skills requirements use signed evaluations. Rule status per facility: Mapped, **Gap**, Needs review, Not applicable (documented), Guidance, or No staff in scope. |
| Compliance dashboards (§11, §14) | **Compliance Center**: training compliance %, completion %, applicable rules, gaps, needs review, a facility compliance ranking, a needs-attention list, regulatory updates, the employees with the most open items, and a 90-day trend from daily snapshots. **Facility page**: staff × requirement matrix and applicable rules. **Regulatory library**: filter by agency, jurisdiction and verification, or "applies to my facilities". **Rule page**: every field, a source link, version history, staff status, decision form and history, and a mapping form. The admin dashboard now has a regulatory compliance card. |
| Regulatory update notifications (§11) | Platform administrators edit rules in a new **Regulatory Library** console. Every change needs a summary and is **versioned automatically by the database** in an immutable history, then audited. Compliance managers in each affected organization are notified: those who decided or mapped the rule, or have a facility it applies to. The organization's decision is flagged for re-review. |
| Audit reports (§15) | **14 of the 15 reports**, each limited by row-level security to what the user may see and **exportable to PDF, Excel and CSV**. Exports require `reports.export`, are audited, and CSV/Excel cells are protected against formula injection. The reports: employee transcript, facility compliance, organization-wide compliance, mandatory training completion, overdue training, certificate expiration, employee competency, exam results, instructor activity, annual summary, **regulatory audit report**, hours by department, hours by employee, and new-employee onboarding compliance. *Course attendance* needs instructor-led sessions, so it comes in Phase 6. |
| Immutable audit records (§15) | Phase 1's hash-chained audit log now also covers regulatory rule creation and updates (platform-level), applicability decisions, rule mappings and report exports. Rule versions and decisions can't be changed once written. |

## 2. Rules enforced by the database (migrations 0008–0010)

| Rule | How |
|---|---|
| No unverified frequency | CHECK `frequency_months is null or frequency_verified`. Verified rules need a verification date. |
| Every rule change is versioned | A trigger requires `app.change_summary` (10+ characters), increments the version and writes a snapshot to `regulatory_rule_versions`. Rules can't be deleted, and the history can't be changed. |
| Platform-only rules | The application role can only read the regulatory tables. |
| Decisions | Insert-only, need `compliance.manage` within the decider's facility scope, and record the decider and current rule version. Facilities must belong to the organization. |
| Regulation-labelled requirements must cite a rule | CHECK on `training_requirements`. |
| Snapshots | Written only by the platform job; read-only to organizations. |

## 3. Tests

| Suite | Result |
|---|---|
| Unit | **76 passed**. New `compliance.test.ts` covers jurisdiction, facility type, designation, duty and exposure matching; rule-state priorities; item status, including frequency vs. expiry, revocation and competency; month arithmetic; library integrity (all 13 categories, no asserted frequencies on review items, unique citations); and CSV formula-injection protection. |
| Integration | **108 passed**. New `compliance.test.ts` covers the seeded library, the rule guards (frequency, summary, delete, history tampering, app-role writes), decision permissions and immutability, mappings (verified vs. review), applicability by state, type, designation and duty, staff completion becoming Current, not-applicable decisions, facility scope, rule update → version, re-review and notifications with a platform audit entry, snapshots, and every report plus the CSV/XLSX/PDF exports. |
| End-to-end | **31 passed** (phases 1–5). New: decision + mapping of a Florida ALF rule, the facility matrix, the regulatory audit report and its three downloads, the transcript, a platform rule update and the organization notification, facility-admin scoping, and learner denial (including the export API). |
| Static checks | `tsc` and ESLint are clean, and the production build succeeds. |

A design issue was found during visual review and fixed. Rules limited to particular duties (e.g. respirator use) showed as gaps at facilities where no employee has that duty. Those rules now show **No staff in scope** until someone matches.

## 4. Important limitations and best-practice recommendations

1. **Qualified review is still required.** The library was compiled with AI-assisted research. Assign a named compliance reviewer per rule in the platform console, and confirm the Cornell LII copies against official publishers before production use.
2. **Pending Florida rulemaking.** AHCA published a development notice on 10-28-2026 to amend chapter 59A-36 (implementing SB 1404, 2026). Every ALF rule carries this warning; re-verify when the amendment is adopted.
3. **Section 1557 (45 CFR 92.9).** Parts of the 2024 rule have been litigated; the rule carries a warning to confirm enforceability with counsel.
4. **HIPAA applicability depends on covered-entity status.** The demo records this as an explicit decision, and each organization should do the same.
5. **Hours-based requirements** (CMS 12 hours/year for nurse aides and home health aides) are tracked with the hours reports. A single course doesn't satisfy them.
6. **Licensure CE and core training** (Board of Nursing/Pharmacy, ALF administrator core training, human trafficking CE) can't be met with academy certificates. The rules say so, consistent with the rule never to present internal certificates as accredited CE.
7. Set **facility designations** (Administration → Facilities) and **employee job duties** (employee profile) so the engine applies the right rules.

## 5. Remaining work (later phases)

| Item | Phase |
|---|---|
| Remaining 12 priority courses (§24), including the Florida ALF staff orientation now that the ALF rules are verified (pending the 59A-36 amendment) | 6 |
| Executive analytics dashboard with filters, charts and course utilization (§14); course attendance report; instructor-led sessions and calendar | 6 |
| AI education assistant, Stripe billing, video hosting and uploads, optional SMS | 6 |
| Additional states (the jurisdiction model is ready for expansion) | Post-launch |
| Security and penetration testing, accessibility audit, load testing, backup/restore drills | 7 |

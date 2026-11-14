# Phase 2 — Learning Management: Completion Report

**Project:** Complete Healthcare Training Academy
**Phase:** 2 of 7 (course catalog, course builder, lessons, video content, enrollment, learning progress)
**Date:** November 13, 2026

## 1. Completed functionality

| Spec item | Delivered |
|---|---|
| Course catalog (§7) | Course Catalog showing the master library plus organization courses, with search, department and "commonly required" filters, enrollment status, certificate and renewal badges. Course detail page covers every §6 field: ID, category, description, audience, prerequisites, objectives, duration, regulatory references, sources, author, reviewer, publication date, version, required designation, certificate eligibility, passing score, renewal, completion criteria, plus the outline and learner ratings. |
| Course builder (§6, §7) | No-code authoring in two scopes: **organization courses** (Catalog → Manage courses) and the **master library** (Platform → Course Library). Covers course settings, objectives, modules and lessons (add / edit / reorder / delete), all 8 lesson types, and a live learner preview. Every input is validated (https-only media, knowledge-check answers must match an option, and so on). |
| Content approval workflow (§17, delivered early) | Draft → Editorial review → Clinical approval (when required; reviewer credentials are recorded) → Compliance approval → Published → Archived. Separation of duties: authors can't review or clinically approve their own work. Request changes / reject sends the version back to draft. Full approval history and version history. Editing a published course starts a new version and copies the content forward. Learners stay on the version they enrolled in. |
| Lessons and media | Reading, case study and illustrated lessons (safe Markdown — raw HTML is never rendered); presentations (slide decks); video; knowledge checks; downloads. |
| Video tracking | MP4/WebM files report real playback position: saved every 15 s, resumes where the learner left off, and completes at 90% watched (enforced on the server). For YouTube/Vimeo embeds, the player can't report position, so they use time on the lesson instead. |
| Enrollment | Self-enrollment pins the current published version. One open enrollment per course is enforced by the database. Prerequisites are enforced by course ID. Retakes create a new enrollment after completion (supports renewals). |
| Progress, bookmarks, resume | Lesson progress, time on lesson (60 s heartbeats), bookmarks, and resume to the last lesson or the first incomplete one. My Learning shows in-progress courses, learning history and bookmarks. |
| Knowledge checks | Graded on the server; correct answers are never sent to the browser. The lesson completes only when every answer is right; learners can retry. |
| Downloadable materials | A printable course handout (Print or save as PDF) built from the learner's pinned version, with knowledge-check answers left out. |
| Course feedback | 1–5 rating and comments; the average rating appears on the course page. |
| Initial content (§24) | **3 of the 15 priority courses fully written:** HIPAA Privacy & Security, OSHA Bloodborne Pathogens, and Standard Precautions/Hand Hygiene/PPE. Each has a full description, 6 objectives, 5–6 modules (11–16 lessons), worked examples and case studies, knowledge checks, a 15-question final exam bank with answers and explanations, regulatory references, cited sources with access dates, and completion criteria. |

## 2. Rules enforced by the database (migration 0003)

- **Learner privacy:** learners can read and write only their own enrollments and progress. Supervisors and administrators need `training.view_all`.
- **Completion guard:** an enrollment can't become COMPLETED unless every required lesson is complete **and** every mandatory exam has a passing attempt. Completed enrollments can't be reopened. This is the database-level part of §8's rule that no certificate is issued without the mandatory assessments.
- **Publishing guard:** a version can't be published without the recorded approvals given since it was last submitted (Review, Clinical when required, and Compliance).
- **Frozen content:** published or archived versions, including their modules, lessons, objectives and exams, can't be changed or deleted.
- **Authoring permission:** writing tenant course content requires `courses.author`. Approval records are append-only.
- `chta_apply_security()` v2 keeps narrowed grants (certificates, approvals) narrow when later migrations re-run it.

## 3. Verification

| Check | Result |
|---|---|
| TypeScript, ESLint (zero warnings), production build | Pass |
| Unit tests | **37 passed** (8 new: grading, approval-stage logic, reference parsing, slide splitting, embed allow-list) |
| Integration tests (PostgreSQL) | **63 passed** (15 new). These cover: content minimums for every library course; the publishing guard; credential-gated clinical approval; frozen content; idempotent enrollment and version pinning; the completion guard; server-graded knowledge checks; a mandatory exam holding learners at "exam pending"; learner privacy; cross-tenant course isolation; DB-enforced authoring permission; the full tenant workflow including separation of duties and version pinning; one open enrollment per course. |
| End-to-end tests (Playwright, production build) | **16 passed** (5 new): learner catalog → enroll → lessons → knowledge check → bookmark → My Learning → resume; slide navigation and the printable materials page; director builds a course → author can't self-approve → org admin approves and publishes → learner completes it; org courses hidden from another tenant; platform library with approval history. |

## 4. Content governance — please read

The three library courses were drafted with AI assistance from current CDC, OSHA and HHS sources, checked on November 13, 2026. The platform deliberately treats them as **unreviewed**:

- They load as **IN_REVIEW** and are labeled *"AI-assisted draft — requires review by a qualified subject-matter expert."*
- The Bloodborne Pathogens and Standard Precautions courses **require clinical approval**, which records the reviewer's license credentials.
- In the demo seed only, they're auto-published with approvals that explicitly say *"NOT a qualified subject-matter or clinical review."* Learners see an amber DEMO notice on the course page.

**Action needed before production:** have a qualified clinician (for example an infection preventionist, RN or MD) and your compliance officer review each course in **Platform → Course Library** and record their approvals through the workflow.

**Regulatory notes captured in the content:**
- The HIPAA Security Rule overhaul proposed on January 6, 2025 is **not final**; federal agendas now project July 2027. The course teaches the current rule and flags the proposal.
- OSHA's bloodborne pathogens standard requires annual retraining (within one year of the previous session) **and** an opportunity for interactive Q&A with a knowledgeable person. The course states that the employer must provide that person.
- No renewal interval is set unless it's verified: Bloodborne Pathogens is set to 12 months (a regulatory requirement); HIPAA and Standard Precautions are left to organizational policy.

## 5. Best-practice notes and decisions

1. **Video hosting.** No videos are bundled, because the platform must not ship unlicensed media. Recommended: upload facility-recorded or licensed videos to object storage (S3/R2 with signed URLs, Phase 6) and link MP4 files so watch-tracking is verifiable. CDC and OSHA publish public-domain videos that can be linked as embeds.
2. **Formative vs. summative.** Knowledge checks are formative and can be retried. The 15-question final exams are stored now as question banks and become mandatory when the Phase 3 assessment engine attaches them (which immediately triggers the completion guard).
3. **Version pinning** protects the integrity of training records: what a learner completed is exactly what was approved.
4. **Running E2E tests:** they expect fresh demo data, so run `npm run db:reset && npm run test:e2e`.

## 6. Deferred, with the phase that delivers each

| Item | Phase |
|---|---|
| Final exams (attach the 15-question banks), grading, retakes, certificates, competency checklists | 3 |
| Course assignments, mandatory training assignments, training calendars, instructor-led and live virtual classes, attendance tracking | 4 (assignments and calendars), 6 (instructor portal) |
| Remaining 12 priority courses (Infection Prevention & Control, Abuse/Neglect/Exploitation, Patient Rights, Emergency Preparedness, Medication Safety, Vital Signs, Fall Prevention, Clinical Documentation, HIV/AIDS Fundamentals, PrEP & PEP, Laboratory Specimen Collection, Florida ALF Staff Orientation) | Written in the same format during Phases 3–5. Florida ALF Orientation needs verification of current AHCA / Ch. 429 F.S. / 59A-36 F.A.C. requirements, which is done alongside the Phase 5 Florida compliance engine. |
| Secure file upload for training materials and video (object storage) | 6 |

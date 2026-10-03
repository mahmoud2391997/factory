# Factory ERP — Arabic UI walkthrough validation

## Final export

- Video: `factory-erp-all-dataflows-ar.mp4`, H.264/AAC, **1600×900**, **25 fps**, stereo **48 kHz**, **12:26.33**.
- The separate aligned Arabic narration WAV is `factory-erp-all-dataflows-arabic-narration-aligned.wav`. The audio and video durations differ by approximately **0.01 seconds**.
- Arabic chapter timestamps: `factory-erp-all-dataflows-chapters.md` (**21 chapters**).
- Arabic narration script: `action-walkthrough-transcript-ar.md`.
- Full route/action and browser-error manifest: `factory-erp-all-dataflows-manifest.json`.

## Recorded coverage and quality checks

- **45/45 canonical routes** loaded at their exact URLs across **21 narrated chapters**.
- Browser page errors: **0**; route mismatches: **0**; manifest warnings: **0**.
- Visual checks included the owner dashboard, the purchasing screen after approval, and the finished-lot nutrition comparison. The quality comparison shows calculated nutrient values, lab readings, specification limits, variance and analysis coverage.
- The PO chapter approved synthetic PO `PO-2026-009` through the app UI, verified the resulting approved status, then dismissed the success toast. Its approved status was confirmed persisted in the isolated PostgreSQL database.
- Other representative form interactions were opened and canceled without saving. The tour does **not** claim to execute every possible transactional workflow, nor did it change quality holds, payroll, bank records, external communications, or access/security settings.

## Database boundary

- No production PostgreSQL credentials/server were available. The app was connected to a **disposable local PostgreSQL test database** populated only with synthetic fixtures; the health endpoint reported `demoMode: false`, PostgreSQL configured/reachable, and bootstrap ready.
- The application database schema was migrated; earlier validation passed the ERP suite (**191 passed, 0 failed**), TypeScript check, and production build.
- After the final approval was verified as persisted, the disposable database, its unique role, temporary credentials, and raw video capture chunks were removed; the local PostgreSQL cluster is stopped.
- Bank, WhatsApp, and physical devices are not connected in this environment. The video and narration state integration limits; there were no external sends or production-data changes.

## Scope

This is a narrated, click-led UI walkthrough and representative safe-action demo—not an exhaustive test of every command or transactional branch, and not a production database audit. All displayed records and the demonstrated purchase approval are synthetic local test data.

# Localization and workflow map verification

Verified 2026-10-05 in an isolated local demo.

## Implemented

- Expanded English and Hindi translation coverage for navigation, screens, forms, print text, validations and feedback. Added source-scanning regression coverage for Arabic literals and template fragments.
- Applied localization at the actual rendered screen boundaries, including login/password and print components. Language changes immediately update direction and locale-dependent formatting.
- Table search and sort operate on translated text using the selected locale. Unknown business record names remain as entered.
- Reworked the map with focused workflow layouts, connected edges, node details, search, fullscreen, fit and anchored zoom.
- Pointer capture and animation-frame updates support node dragging and canvas panning. Keyboard navigation supports node movement, zoom and fit. Escape exits fullscreen without disrupting the workflow layout.
- Added map geometry tests for zoom anchoring, bounds fitting and edge attachment.

## Verification evidence

- `pnpm check`: TypeScript passed; 252/252 automated tests passed.
- `pnpm --filter @erp/web exec next build --webpack`: production build passed.
- Browser audit: all 88 unique main-navigation pages were opened in both English and Hindi. Visible headings, buttons, labels, column headers and paragraphs had no remaining Arabic text in the checked default views.
- English login and Hindi dashboard verified, including persisted language across navigation.
- Pointer drag moved the supplier node by the expected zoom-adjusted distance; keyboard right-arrow moved it another 10 map units.
- Production workflow displayed its six steps. Mobile fullscreen checked at 390 × 844 with no document horizontal overflow; desktop viewport restored afterward.
- Browser console error check on the final map view returned no errors.

This verifies default demo views and source translation coverage; it does not certify every modal state, device or translation's linguistic quality. Business names and user-entered content are preserved. Native English source text and technical identifiers may remain English in Hindi views.

## Run locally

Run `pnpm dev:demo`, then open http://127.0.0.1:3000 and choose the demo login button. The command uses webpack, explicitly disables configured database/Supabase connections, and stores demo data in the OS temporary directory under `factory-ui-demo`.

The current session runs at that address. For normal database development, follow DEVELOPMENT.md. Production deployment, database migrations and recovery still require the environment-backed checks recorded in DEVELOPMENT-READINESS.md.

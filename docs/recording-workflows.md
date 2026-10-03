# Recording the ERP UI workflows

`record-workflows.ts` records the actual Arabic-language app UI at 1600×900. It reads the route catalog in `apps/web/lib/nav/config.ts`, verifies the non-demo PostgreSQL health endpoint, signs in through the visible login form, clicks through each canonical route using the app's navigation search, and writes a route manifest. It does not create or edit ERP records.

## Prerequisites

- Run the app with an authorized, read-only-compatible account and a populated PostgreSQL database.
- Install dependencies and generate Prisma Client: `npm ci && npm run generate --workspace=@erp/database`.
- Install the Playwright Chromium binary: `npx playwright install chromium`.
- Install FFmpeg and `ffprobe` for MP4 export.
- Prepare an Arabic WAV voiceover (the generated track is `recordings/arabic-narration.wav`).

## Record and export

Set credentials in the shell or a private, untracked environment file; never commit them. With the app available at `http://127.0.0.1:3000`, run:

```bash
RECORDER_BASE_URL=http://127.0.0.1:3000 \
RECORDER_EMAIL='your-authorized-account@example.com' \
RECORDER_PASSWORD='your-password' \
node_modules/.bin/tsx --tsconfig apps/web/tsconfig.json \
  record-workflows.ts --voiceover=recordings/arabic-narration.wav
```

The default outputs are:

- `recordings/factory-erp-dataflows.mp4` — H.264/AAC video with voiceover.
- `recordings/factory-erp-dataflows-raw.webm` — original screen capture.
- `recordings/workflow-manifest.json` — route list, navigation method, database health snapshot, and browser errors.

Optional variables:

- `RECORDER_OUTPUT` changes the MP4 destination.
- `RECORDER_OUTPUT_DIR` changes the recordings directory.
- `RECORDER_PAGE_HOLD_MS` changes the pause after each route (default 2300 ms, to keep the exhaustive tour readable and paced with the full narration).
- `RECORDER_MAX_PAGES` limits a local smoke run; omit it for full coverage.

The script draws a smooth, visible cursor and click ripple over the real browser page. It checks for production PostgreSQL mode (`demoMode: false`), a reachable database, bootstrap readiness, and successful visible login before recording. Use a non-production validation environment where possible; never reuse the disposable test password from this task.

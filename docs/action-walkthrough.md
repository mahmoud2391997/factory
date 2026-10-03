# Arabic action walkthrough recorder

`record-action-walkthrough.ts` records the Factory ERP through its real browser UI, follows the canonical navigation catalog, animates a visible pointer, plays Arabic narration one chapter at a time, and muxes a timeline-aligned WAV into the exported MP4.

## Preconditions

- Start the app against a disposable, local PostgreSQL validation database and confirm `/api/health` is healthy.
- Use a synthetic demo account only. Keep credentials in a private environment file outside the repository; never commit it.
- Ensure the 21 chapter WAVs are present under `recordings/narration/`.

## Run

```bash
set -a
source /home/ubuntu/factory-recorder-auth.env
set +a

# Short, separate preflight output (does not overwrite the final video)
RECORDER_MAX_CHAPTERS=2 node_modules/.bin/tsx --tsconfig apps/web/tsconfig.json record-action-walkthrough.ts

# Full tour
node_modules/.bin/tsx --tsconfig apps/web/tsconfig.json record-action-walkthrough.ts
```

The full run creates the Arabic MP4, an aligned WAV master, a chapter list, and a JSON route/action manifest under `recordings/`. The 21 source narration clips are kept under `recordings/narration/`; the final MP4, clips, transcript, chapters and manifest can be committed. The merged PCM WAV, raw browser video, normalized intermediate audio, preflight exports and local validation state are scratch files and are excluded by `recordings/.gitignore` (the merged WAV exceeds GitHub's 100 MB per-file limit).

## Synchronization and safety

- Each clip's playback start is timestamped against the screen-capture start. The next chapter waits for the previous clip to end; the master narration inserts only the actual inter-clip silence measured by the run.
- Route changes occur at planned offsets within the corresponding chapter, using visible search/navigation clicks and a smooth mouse path.
- Forms are opened and canceled without saving, except one seeded purchase order is approved in the disposable local PostgreSQL dataset to demonstrate the approval transition.
- The narration identifies synthetic data and states that bank feeds, WhatsApp, the physical scale and fingerprint reader are not connected in the recording environment. It also discloses product gaps listed in the operator manual.
- No external messages, production writes, payments or hardware actions are performed.

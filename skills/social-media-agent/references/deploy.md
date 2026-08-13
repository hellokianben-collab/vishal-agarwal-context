# The published dashboard and the command queue

Read this when working on the Vercel side, the password, or why a button
pressed on the phone did or did not reach the laptop.

## Why the agent is not on Vercel

The brain is `claude -p` using Vishal's local Claude Code subscription. There
is no Claude binary and no local OAuth on a serverless function, and Vercel has
no persistent disk for the SQLite database or the thumbnail files. Moving the
agent there would mean an Anthropic API key and a monthly bill — the one thing
he explicitly did not want.

So the agent stays local and the two halves talk through a queue.

## How a web button reaches the laptop

```
he presses Fix it now (phone)
        ↓  POST /decide, session cookie checked
Vercel writes a command into a private Blob store
        ↓  run_sync.py, every 15 minutes, X-Agent-Token
the laptop pulls it, applies it, acknowledges it
        ↓
does the work, republishes the site
```

Up to 15 minutes of latency. That is the honest cost of a free brain, and the
docs say so rather than hiding it. `python run_sync.py` forces it.

**The whole command lives in the blob pathname**:
`queue/<epochms>-<flagid>-<action>-<reason>-<fixkind>.cmd`, body is one byte.
`list()` returns pathnames without downloading anything, so the queue is read
in one call with no file reads and no private-blob download dance.

## The Vercel project

- Project: `socialagent-dashboard` under `susanta-podders-projects`
- Folder: `socialagent/site/`
- Alias: https://socialagent-dashboard.vercel.app
- One serverless function, `api/index.js` — the free plan caps a project at 12,
  and a router is simpler than a directory of endpoints anyway
- `vercel.json` rewrites everything to `/api/index`, and sets `noindex`,
  `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`

### Environment variables

| Name | Purpose |
|---|---|
| `DASH_PASSWORD` | the login password |
| `DASH_SECRET` | HMAC key for the session cookie, so a leaked cookie cannot be reversed into the password |
| `AGENT_TOKEN` | shared secret proving it is the laptop pulling commands; the same value is in the local `.env` |
| `BLOB_READ_WRITE_TOKEN` | injected automatically by the linked Blob store |

Set them with `vercel env add NAME production`. **Piping a value in appends a
newline**, which silently breaks every comparison — `api/index.js` has an
`env()` helper that trims, and you should use it for anything new.

### Why the HTML is inside the function

Static files on Vercel are served straight off the CDN and would bypass the
password entirely. So the rendered pages are bundled as `api/snapshot.json` and
only ever leave the function after the cookie is verified. Thumbnails are
inlined as data URIs for the same reason.

### Security properties, verified live

- `POST /decide` with no cookie → login page, nothing queued
- `GET /agent/pull` with no token → `401`
- queue is a **private** Blob store, not readable from the internet
- password and token compared with `crypto.timingSafeEqual`
- every queued command validated twice against a strict allowlist — once in the
  function on the way in, once in `publish/commands.py` on the way out. The
  queue is a path into his laptop; nothing that does not match exactly runs.
- `MAX_QUEUE` refuses new commands if the laptop has not synced in a long time,
  rather than piling up work that would all fire at once

## Commands

```bash
cd "C:\Users\Susanta Podder\Desktop\claude\socialagent"

.\.venv\Scripts\python.exe -m publish.snapshot            # build only
.\.venv\Scripts\python.exe -m publish.snapshot --deploy   # build and push live
.\.venv\Scripts\python.exe -m publish.commands --peek     # what is queued
.\.venv\Scripts\python.exe -m publish.commands            # apply it now
.\.venv\Scripts\python.exe run_sync.py                    # the whole 15-min job
```

Change the password:

```bash
cd site
vercel env rm DASH_PASSWORD production
vercel env add DASH_PASSWORD production
vercel deploy --prod --yes
```

## Gotchas specific to this deployment

- **`vercel` is a `.cmd` shim** — `subprocess` cannot resolve the bare name.
  `publish/snapshot.py` uses `shutil.which("vercel")`.
- **`@vercel/blob` below v2 refuses private stores** client-side. Pinned
  `^2.6.1`.
- **Vercel pre-parses JSON bodies** into an object; a raw-body reader would
  re-encode it as form data and fail to parse. This silently left acked
  commands in the queue so every sync re-ran the same work. Use `readJson()`.
- **`site/.env.local` and `.env.prodtest`** may hold a real
  `BLOB_READ_WRITE_TOKEN`. `.vercelignore` excludes `.env*`; never commit them.
- `publish.enabled: false` in `config.yaml` turns the whole thing off.

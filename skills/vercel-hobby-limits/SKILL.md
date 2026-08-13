---
name: vercel-hobby-limits
description: >-
  Survive Vercel's free-tier walls without upgrading — the 12-serverless-function cap and the router
  consolidation that answers it, the 4.5 MB response cap, filesystem-resolved-before-rewrites,
  query-string merging on rewrites, immutable asset caching, and env vars that read back empty. Use
  when a deploy fails with a function-count error, when a rewrite "does nothing", when a form silently
  falls through to the wrong handler, when a large file returns FUNCTION_PAYLOAD_TOO_LARGE, when
  assets serve stale after a deploy, or before adding any new endpoint to a Hobby-plan project. Also
  use when planning an architecture that will run on Hobby.
---

# Living inside Vercel's Hobby limits

Every project in this environment is on **Hobby**. Upgrading is the owner's paid decision, so the
answers here are architectural.

---

## 1. The 12-function cap

```
No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan
```

Vercel builds **one function per file under `api/`**. The error appears at **deploy time**, not while
coding — so it lands exactly when you are trying to ship.

### The router pattern

Real handlers live in `lib/routes/` (one file per job, logic unchanged). `api/` holds a handful of
**thin routers** that dispatch on a `?do=` query parameter.

```
api/admin.js   → lib/routes/{admin-page, admin-login, admin-view, order-stats, bkash-status}
api/book.js    → lib/routes/{read, book-file, book-download, book-track, resend-book}
api/order.js   → lib/routes/{order-config, order-create, bkash-callback}
api/forms.js   → lib/routes/{waitlist, contact, consult, track}
```

**Every original public URL is preserved by a rewrite in `vercel.json`.** Bookmarks, curl scripts,
and — critically — the callback URL already registered with a payment gateway all keep working. POST
survives a rewrite intact.

Result on a real project: **16 functions → 4 routers**, no public URL changed.

**Rules when adding an endpoint:**

1. Write it in `lib/routes/`.
2. Add one line to the right router.
3. Add one rewrite.
4. **Check `ls api | wc -l` before ever adding a bare file to `api/`.**

Handlers in `lib/routes/` require siblings as `require('../db')`, not `require('../lib/db')`.

## 2. Rewrites MERGE the query string — they do not replace it

The subtlest bug in this whole file, and it cost an hour.

`/community` rewrites to `/api/community?do=page`. A form posting to `/community?do=signup` arrives
with **`do` still resolving to `page`** — Vercel merged the incoming query into the destination's and
the destination's value won. Every form silently fell through to re-rendering the page. **HTTP 200,
no error, nothing in the logs.**

> **Rule:** pages may use the pretty rewrite, but **every form action and every fetch must target the
> function path directly** — `action="/api/community?do=signup"`, never `/community?do=signup`.

Pretty paths that carry no `do` of their own (`/community/verify`, `/community/reset`) are fine.

The same merging behaviour is what makes `/api/admin-view?key=…` work when the rewrite already
supplies `?do=view` — so it is useful, not just dangerous. Know which case you are in.

## 3. The filesystem is checked BEFORE rewrites

A `rewrites` entry for `/admin` is **silently dead** while `admin.html` exists — with
`cleanUrls: true`, `/admin` resolves to the static file first and never reaches the function.

> **To route a clean path at a serverless function, the same-named static file must not exist.**
> Delete it. Renaming the nav link is not enough.

Rough order: `headers → redirects → filesystem → rewrites`.

## 4. The 4.5 MB response cap

A function response body is hard-capped at 4.5 MB (`FUNCTION_PAYLOAD_TOO_LARGE`).

Two ways through it:

**Streaming/ranged reads** — never serve the whole file. Forward the client's `Range` header
upstream; when a request arrives with *no* Range, ask for the first ~3 MB anyway and answer `206` +
`Content-Range`. That is precisely the signal PDF.js (and most range-aware clients) use to learn the
total length and switch to ranged fetching.

**Full downloads** — dodge the cap entirely: record the event, then `302` to storage.

## 5. Caching and cache-busting

`/assets/*` and `/vendor/*` are typically served `immutable, max-age=31536000`. Anything in there
needs a **`?v=N` query or a new filename**, or browsers keep the old bytes for a year.

For app CSS/JS, `Cache-Control: max-age=0, must-revalidate` plus a `?v=N` on the tag is the safer
default. **Bump `N` on every deploy that changes JS or CSS.**

**Gotcha:** cache-busted references hide in non-HTML files. A stylesheet referenced only from a
server-render module or another CSS file will not be found by grepping the HTML. Grep the whole
project.

## 6. Environment variables

- **`vercel env pull` returns `""` for "Sensitive" variables.** An empty read is **not** evidence the
  variable is unset. Do not "fix" a working deploy on this basis.
- **Piping a value into `vercel env add` appends a newline**, silently breaking every string
  comparison. **Trim env vars on read.**
- `vercel env add <NAME> preview` **fails non-interactively** when the project is not a git repo — it
  wants a branch. Production and Development still work; preview will fall back.
- Marketplace integrations (e.g. Neon) inject **non-sensitive** vars, which *can* be pulled — useful
  for running a real migration locally against production Postgres. Delete `.env.local` afterwards.

## 7. Provisioning a database from the CLI

```bash
vercel integration discover neon     # find the marketplace slug
vercel integration add neon          # from the project folder
```

The first call returns `action_required` / `integration_terms_acceptance_required` with a
`verification_uri`. That is a **terms acceptance and requires the human** — the CLI says so. Once
accepted, re-run `vercel integration add neon`: it provisions, auto-connects to the current project,
and injects env vars in one shot. Then `vercel deploy --prod --yes` so running functions pick up the
new variable.

Same two-step dance for any Marketplace resource.

## 8. Domains — the dangerous one

`vercel domains inspect` **lies** about which project owns a domain. It will list a retired project
alongside the live one, which reads as a double-claim needing an urgent fix. Check the per-project
API before acting:

```bash
curl -s -H "Authorization: Bearer $T" \
  "https://api.vercel.com/v9/projects/<project>/domains?teamId=<team>"
```

And if you *do* need to move a domain between projects on third-party DNS:

> **Add the `_vercel` TXT record FIRST, then move.** Detaching resets verification; Vercel then
> demands the TXT record and the domain **404s on both projects** until it exists. Re-attaching does
> not undo it. This took a live site down for ~20 minutes.

The CLI auth token is at `AppData/Roaming/xdg.data/com.vercel.cli/auth.json`.

## Pre-deploy checklist

```bash
ls api | wc -l                                   # ≤ 12
node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))"
for f in api/*.js lib/**/*.js; do node --check "$f" || echo "FAIL $f"; done
grep -rn 'action="/[a-z-]*?do=' *.html           # forms must target /api/… directly
ls admin.html 2>/dev/null && echo "will shadow the /admin rewrite"
```

## Related

- `vercel-node-serverless` — the full Express-on-serverless playbook (ephemeral FS, includeFiles)
- `zero-js-admin-panel` — depends on the filesystem-before-rewrites rule

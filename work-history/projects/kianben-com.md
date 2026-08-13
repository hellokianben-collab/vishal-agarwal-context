# kianben.com — shared-import community

**Status:** live · **Started:** 11 Jul 2026 · **Stack:** Express on Vercel serverless + Neon
Postgres · **Deep skill:** `skills/kianben-web` · **Repo:** `github.com/hellokianben-collab/kianben.web`

A community platform for Bangladeshi traders who are too small to fill a container alone and pool
into shared imports together.

---

## What it does

- **Cargo board** (`/board`) — members post what they want to import; others join the slot
- **Membership** — application flow, admin review, member sign-in
- **Book shop** (`/book`) — animated 3D CSS/SVG book, a paginated **free preview reader**, order
  modal with bKash/Nagad selection, Dhaka vs outside-Dhaka delivery pricing, live total, TrxID field
- **Admin SPA** — applications, members, import orders, announcements, pricing, book orders

## The bug that became a skill

Members could register and sign in — and then an hour or two later, *"invalid email or password"*,
with no change on their side. Orders and admin edits disappeared too.

Cause: the app stored everything in a `kianben.json` file next to `server.js`. On Vercel that
filesystem is **ephemeral and per-instance**. Writes survive until the next cold start, then vanish.

The fix was deliberately **not** a rewrite. Two store adapters (`store-app.js`, `store-book.js`)
expose the **same method names** and switch backend on `DATABASE_URL`: the JSON file locally,
Neon Postgres in production. Routes just `await` them. Nothing else in the codebase changed.

That pattern — dual-mode adapter, identical surface, env-switched — is now the
`vercel-node-serverless` skill and it has been reused since.

**Standing rule for this repo: never reintroduce a direct `fs` JSON write inside a request handler.**

## Data model note

Production uses a deliberately generic shape rather than a table per entity:

```
app_records (collection TEXT, id INT, data JSONB, PK(collection,id))
app_counters (collection TEXT PK, n INT)
app_kv       (k TEXT PK, v JSONB)
book_orders  (typed columns)
book_config  (id=1, config JSONB)
```

Filtering happens in JS because the datasets are small. This is the right trade at this size and
would be the wrong one at 100× the rows — worth revisiting, not worth pre-optimizing.

## Page architecture

The site began as one long scrolling `index.html`. Book and Board were pulled out into
**standalone pages** with their own self-contained JS (`book.js`, `board.js`) that reuse the same
API contracts rather than importing the whole `main.js`. The homepage keeps a 3-item board teaser
and a "See the full board" link.

Services and Sign-in stayed inline **on purpose** — services is the core pitch and belongs on the
home page, and a modal is the right pattern for auth.

## The hero animation lesson

Asked for a moving background with *"I instruct you to Chose it. I give you all the permissions"*,
the delivered answer was a 2D canvas effect. It was rejected as unambitious. The site runs helmet
with `contentSecurityPolicy: false`, so external CDN scripts — three.js included — load fine in
production. **There was never a technical blocker to real WebGL.** That is the whole lesson.

## Deployment reality

The GitHub repo exists but this machine has **no push access to it**, so deploys are Vercel CLI
uploads, not git-push. `kianben.com` is live on the apex; `www` is not configured.

---
name: vishal-agarwal-site
description: >-
  Project context + working guide for Vishal Agarwal's personal site
  (iamvishalagarwal.com) — a multi-business portfolio (import/export, wig
  manufacturing, Confidence Cement dealership, business education) rebuilt from a
  Claude Design export into plain HTML/CSS/JS + Vercel serverless functions +
  Postgres. Load this whenever the user works on iamvishalagarwal.com, "my site",
  "the portfolio", the book "Prothom Container", the ebook/PDF reader and its
  reading analytics, consultation bookings and the admin panel for scheduling
  calls (Zoom/Google Meet), bKash payments, the waitlist/contact forms, the
  video/media section, testimonials, or anything in the Desktop/claude/vishal-site
  folder. Also covers the tools mounted on the domain: /landed (the Bangladesh
  landed-cost and NBR duty-cascade calculator, its 7,465-code tariff dataset and
  the sync-landed.js path rewrite), /community (member accounts, scrypt passwords,
  saved calculations), /garmentmind (the L/C discrepancy landing page), and the
  admin security layer (per-device lockout, master key, audit trail, key
  rotation). It carries the architecture, file map, deploy steps, the
  owner-corrected facts that must never regress, content-integrity rules, and the
  expensive gotchas (domain moves, Claude Design imports, preview-pane lies,
  Vercel rewrites that merge query strings, fail-open key checks) so a fresh
  conversation can continue without re-deriving or repeating them. Use it even for
  vague asks like "fix the site", "add my videos", "deploy my changes", "the
  calculator is broken", "add a tool", or "put it on the domain". For generic
  Vercel-serverless mechanics see `vercel-node-serverless`.
---

# Vishal Agarwal site — project context & working guide

Personal/brand site for **Vishal Agarwal**, a Bangladeshi entrepreneur: importer
(garlic, ginger, rice, pulses, spices), exporter (handmade wigs → China),
Confidence Cement dealer (Naogaon), and business educator/author.

## Where things live

| Thing | Value |
|---|---|
| Source | `C:\Users\Susanta Podder\Desktop\claude\vishal-site` |
| Vercel project | `vishal-site` (`prj_q7Qp4KfoEcmooi8zbeGqV5XOqiTW`) |
| Live | **https://iamvishalagarwal.com** (apex canonical, `www` 308→apex) + `vishal-site-five.vercel.app` |
| Routes | `/` · `/contact` (consultation booking) · `/order` (book checkout, noindex, dormant) · `/read/<token>` (ebook reader, noindex) · `/admin` (owner dashboard, noindex) · `/api/admin-view?key=…` (zero-JS dashboard) |
| Deploy | `vercel deploy --prod --yes` from the folder |
| Old site | project `vishal-portfolio` (`prj_iFNOwz1WP5WRwXvZfbsDRS9Dndyh`), folder `Desktop\Vishal web trial 4` — **retired**, no longer on the domain |

No git repo. Deploys are direct from the folder.

## ⚠️ Hobby plan caps a deployment at 12 functions — the API is consolidated (30 Jul 2026)

A deploy failed with `No more than 12 Serverless Functions can be added to a Deployment on the
Hobby plan`. Vercel builds **one function per file under `api/`** and the site had grown to 16.

**The architecture now:** every handler lives in **`lib/routes/`** (one file per job, logic
unchanged) and `api/` holds only **4 thin routers** that dispatch on `?do=`:

| Router | Dispatches to `lib/routes/` |
|---|---|
| `api/admin.js` | admin-page · admin-login · admin-view · order-stats · bkash-status |
| `api/book.js` | read · book-file · book-download · book-track · resend-book |
| `api/order.js` | order-config · order-create · bkash-callback |
| `api/forms.js` | waitlist · contact · consult · track |

**Every public URL is preserved by a rewrite in `vercel.json`** — `/api/waitlist`,
`/api/bkash-callback`, `/api/admin-view?key=…` all still work, so bookmarks, curl scripts and the
callback URL already registered with bKash keep running. Vercel **merges** the incoming query
string into the destination's, which is why `?do=view` and `?key=…` coexist. POST survives a
rewrite intact (the admin consultation forms depend on it).

**Rules when adding an endpoint:** write it in `lib/routes/`, add one line to the right router, add
one rewrite. **Never add a bare file to `api/`** without checking `ls api | wc -l` — **5 used, 7
spare** (`admin`, `book`, `order`, `forms`, `community`). Handlers in `lib/routes/` require siblings
as `require('../db')`, not `require('../lib/db')`.

### ⚠️ A rewrite that hardcodes `?do=` CANNOT also accept one (cost an hour, 31 Jul 2026)

`/community` rewrites to `/api/community?do=page`. Vercel **merges** the incoming query string into
the destination's rather than replacing it, so a form posting to `/community?do=signup` arrived with
`do` still resolving to `page`. Every form silently fell through to re-rendering the page — a 200,
no error, nothing in the logs.

**Rule:** pages may use the pretty rewrite, but **every form action and fetch must target the
function path directly** — `action="/api/community?do=signup"`, not `/community?do=signup`. Pretty
paths that carry no `do` of their own (`/community/verify`, `/community/reset`) are fine.

## Current state at a glance (31 July 2026)

| Area | State |
|---|---|
| **`/landed`** — Bangladesh landed-cost calculator | **live**, real NBR tariff, 7,465 HS codes |
| **`/community`** — member accounts + saved calculations | **live** |
| **`/garmentmind`** — L/C discrepancy checker landing page | **live**, links to garmentmind.vercel.app |
| **`/invoice`** — free invoice generator | **live**, static, ported from the `quickbill` project |
| Home page (`index.html`) | **unchanged / original** — a 1 Aug WebGL-hero redesign was reverted at the owner's request; see the OFF LIMITS section |
| `garmentmind.iamvishalagarwal.com` | **live** (1 Aug 2026) — A record `garmentmind` → `76.76.21.21` at Namecheap; `garmentmind.vercel.app` still resolves too |
| **Admin security** — device lockout, master key, audit trail | **live** (see its own section) |
| Public site (home, `/contact`) | **live**, content complete |
| Neon Postgres | **connected** — `waitlist`, `contacts`, `orders`, `visits`, `consultations`, `ebook_grants`, `book_readers`, `book_events`, `book_progress` |
| Waitlist + greeting email | **live** (Resend) |
| **Consultation booking** `/contact` | **live** — real booking form, instant owner alert, admin panel to accept/schedule/invite |
| Book checkout `/order` (bKash PGW) | **code complete, dormant** — buy button hidden, `data-onsale="false"` |
| **Ebook delivery + reader analytics** | **live, dark** — needs `BOOK_PDF_URL` + `BOOK_FORMAT=ebook` to switch on |
| bKash credentials | **BLOCKED** — needs the owner's own sandbox/production creds |
| Buy-page visitor tracking | **live** |
| Owner dashboard `/admin` | **live, 100% server-rendered (no JS)** |

## Stack / file map

Static pages + **4 Vercel serverless functions** (routers; see the cap section above). No framework,
no build step.

**Pages / client assets**
- `index.html` — home: hero · marquee · services · ventures · about · media · book · testimonials · CTA band · footer
- `contact.html` — `/contact` ("Work With Me") page + **consultation booking form**
- `order.html` — `/order` book checkout (name/phone/address/city-combobox/qty → bKash); result panels driven by `?status=`
- `style.css` — the whole public design system · `admin.css` — admin-only styles · `reader.css` — ebook reader chrome
- `app.js` — all public behaviour (nav, reveals, cursor, canvas, countdown, video modal, marquee, waitlist/consult forms, order form + city combobox, visit beacon, on-sale flip)
- `reader.js` — **ES module**, the only new client JS: PDF.js glue + reading beacons
- `bd-locations.js` — `window.BD_LOCATIONS`, 570 English BD place names for the city combobox
- `vendor/pdf.min.js` + `vendor/pdf.worker.min.js` — **pdfjs-dist 5.4.149**, self-hosted (CSP is `script-src 'self'`; a CDN is impossible). Renamed from `.mjs` to `.js` to sidestep any MIME doubt — they are still ES modules and load with `type="module"`.
- **There is no `admin.html`/`admin.js`** — deleted on purpose; `/admin` is server-rendered (see the admin section)

**`api/` — 4 routers only** (see the 12-function cap section). Real handlers are in `lib/routes/`:

**`lib/routes/` — public**
- `waitlist.js` — verify via `lib/verify-email.js`, insert, best-effort greet
- `contact.js` — legacy plain message form (name/email/message). Superseded by `consult.js`
- `consult.js` — **consultation booking**: validate, insert, alert the owner, ack the requester
- `order-config.js` — read-only format/price/shipping so the page total can't drift from the server
- `order-create.js` — validate, price **server-side**, insert `initiated` order, bKash Create → `bkashURL`
- `bkash-callback.js` — Execute + verify amount → `paid`, mint the ebook grant, emails, redirect
- `read.js` — `/read/<token>`: the reader gate (GET), identify (POST), reader shell, records `open`
- `book-file.js` — Range-proxied PDF bytes · `book-download.js` — records the download, 302s to storage
- `book-track.js` — reading beacon (always 204) · `resend-book.js` — "I lost my link"
- `track.js` — visit beacon for `/order` (always 204)

**`lib/routes/` — owner-only** (all via `lib/admin-auth.js` → cookie / `x-admin-key` / `?key=`)
- `admin-login.js` — form POST or `?key=` → sets the session cookie; `?logout=1` clears it
- `admin-page.js` — **`/admin`** via rewrite; renders login form or the dashboard
- `admin-view.js` — `/api/admin-view?key=…`, same dashboard with the key in the URL
- `order-stats.js` — JSON stats · `bkash-status.js` — reconcile one order

**lib**
- `db.js` — `pg` Pool (`DATABASE_URL || POSTGRES_URL || …`) + owns the schema migration
- `phone.js` — `normalizePhone()`, the single BD-mobile rule (checkout + reader gate + booking)
- `product.js` — `productConfig()` / `amountFor()`: what's on sale (`BOOK_FORMAT`) and what it costs
- `verify-email.js` — syntax + disposable block + typo catch + live MX/A/AAAA + Gmail/plus canonicalization (`canonicalize()`, reused by `db.js`'s backfill)
- `mailer.js` — `sendMail` + `sendGreeting` + `sendOrderEmails` + `sendBookLink` + `sendConsult{New,Invite,Decline}`; supports **attachments** (base64) for the `.ics` invite
- `bkash.js` — sandbox/prod switch, token cache + 401 retry, create/execute/query/refund
- `zoom.js` — Zoom **Server-to-Server OAuth** meeting creation; no-ops cleanly when unconfigured
- `ebook.js` — grants, reader cookies, `authorize()`, `recordEvent()` rollups, `hasFinished()`
- `consult.js` — booking validation, Dhaka-time helpers, `.ics` generation, topic/slot vocab
- `consult-actions.js` — what the admin buttons do (accept/schedule/decline/save) + notices
- `read-render.js` — server-rendered gate / reader shell / error pages
- `reconcile.js` — `reconcileInvoice()`, shared by `bkash-status` and the admin **Check** link
- `admin-auth.js` — `checkAdmin` / `keyMatches` / `readCookie` / HMAC session cookie helpers
- `admin-data.js` — `getStats()` / `getBookStats()` / `getInbox()`, the single SQL source for both admin views
- `admin-render.js` — server-rendered HTML (`loginPage` / `dashboardPage` / `errorPage` / `ordersCsv` / `readersCsv`) + `esc()`
- `admin-handler.js` — shared request handling for `/admin` and `/api/admin-view` (`?format=csv[&t=readers]`, `?recheck=`, **POST consultation actions**)

**Config**
- `vercel.json` — `framework:null`, `cleanUrls:true`, **16 rewrites** mapping every legacy public path onto the 4 routers, CSP + security headers, `/assets` + `/vendor` caching, noindex on `/admin` + `/order` + `/read/*`
- `assets/` — `book-cover.jpg` (1054x1492), `venture-{trade,wig,cement,education}.jpg`
  (1024x559 AI port scenes), `hero-dog-cutout.webp` (**current hero** — Vishal + his golden
  retriever, cutout on amber), `portrait-cutout.webp` (green-shirt cutout — **now the about
  image**, on a cream→amber frame), `about-cutout.webp` (old B&W headshot — **now unused**,
  kept only as an artifact), `fb-<id>.jpg` ×8 (self-hosted FB reel
  thumbnails). All real photo slots on the page are now filled.

**Always bump the cache-busting query** on change, in **all three** HTML files (`index`, `contact`,
`order`): `style.css?v=N`, `app.js?v=N`. Currently **`style.css?v=25`, `app.js?v=8`,
`bd-locations.js?v=1`, `admin.css?v=7`, `reader.css?v=1`,
`reader.js?v=1`, `community.css?v=5` (referenced from `lib/routes/community.js` AND
`garmentmind.html` — bump both), `community.js?v=4`, `community3d.js?v=3`,
`invoice.css?v=1`, `invoice.js?v=1`**. `admin.css` is
referenced from `lib/admin-render.js` and `lib/routes/admin-login.js`; `reader.css`/`reader.js`
from `lib/read-render.js` — **none of them from any HTML file**, so grep those when bumping.

**`/assets/*` and `/vendor/*` are served `immutable, max-age=31536000`** (`vercel.json`). Anything
in there needs a `?v=N` query (or a new filename) or browsers keep the old bytes for a year —
`assets/book-cover.jpg?v=1` today.

**Concurrent sessions touch this repo.** A second Claude Code session working on this same
folder added `lib/verify-email.js` + `lib/mailer.js` and rewrote `api/waitlist.js` mid-session
without any heads-up beyond a `PostToolUse` hook noting "another chat's dev server is running
in this folder." If files look different than you last left them (check mtimes — `find . -printf
'%T@ %p\n' | sort -n`), **read them fully before assuming your own memory of the file is
current**, and verify behaviour against the live URL (`curl`) rather than fighting over a local
dev server. The other session's work here was legitimate, high-quality, and consistent with
this skill's conventions — respect and build on it, don't silently revert.

## Brand

Olive `#333e1c` · amber `#ee9d24` · cream `#faf8f2` · ink `#1b1c17` · muted `#5c5e52`.
Font: **Poppins only**. Organic amber blob shapes, rotated marquee bands, `✳` motif.

## Owner-corrected facts — DO NOT REGRESS

These were explicitly corrected; earlier drafts had them wrong.

- Name is **Vishal** Agarwal. The Claude Design export said "Bishal" — a typo.
- **28+** entrepreneurs mentored (NOT 1,000 / "thousands").
- **4+ years** in trade (NOT 6+).
- Book is **"Prothom Container"** (NOT "Building Businesses Beyond Borders"), launch `2026-07-31T19:00:00+06:00`, live countdown + waitlist.
- Email **mvishal550@gmail.com** (NOT the older personal address that appeared in early drafts).
- **No Bengali anywhere — all English.** Noto Sans Bengali font removed. Real Bengali YouTube titles are shown as English translations.
- Hero keyword row (IMPORTER/EXPORTER/…) is **bold**.
- No rotating ring/badge around the hero portrait — removed on request.
- **No brand name on the cement venture — just "Cement".** Owner said "Confidence Cement" appears
  in too many places; genericized everywhere (`<h3>Cement</h3>`, "cement dealer", "cement
  dealership", marquee bands, hero keyword strip). Do not reintroduce a specific cement brand name.

Unresolved factual questions (ask, don't guess): "5 COUNTRIES" but only 4 are named (BD/CN/IN/VN); "4 VENTURES" vs "4+ BUSINESSES"; 250K+ followers vs 175K on Facebook.

## Media section (videos)

Platform tabs: YouTube / Facebook / Instagram / TikTok. Data lives in `VIDEOS` in `app.js`.

- **YouTube tab is real**: 11 genuine video IDs from the channel, English titles, real
  `https://i.ytimg.com/vi/<id>/hqdefault.jpg` thumbnails (permanent, safe to hardcode).
- **Facebook tab is real**: 8 genuine reels the owner pasted links for. Cards use a branded
  gradient placeholder (`.vid-thumb-fallback`, reusing `.tone-1..4`) instead of a thumbnail
  image — Facebook's CDN thumbnail URLs are **signed and expire** (`oh=`/`oe=` query params),
  so they must never be hardcoded as `<img src>`.
- Both platforms play **in-page** in the same modal (`#vmodal`): YouTube via
  `youtube-nocookie.com/embed/<id>`, Facebook via
  `facebook.com/plugins/video.php?href=<encoded permalink>&autoplay=true` — branch on
  `data-platform` on the card. Never bounce the visitor to the channel/profile.
  `vercel.json`'s CSP `frame-src` must list both `youtube-nocookie.com`/`youtube.com` and
  `www.facebook.com`.
- **IG/TikTok tabs show an empty state** — could not be fetched (IG needs login, TikTok
  serves a bot-check). To populate: get post URLs from the owner, same pattern as FB.

**How to pull real data from a platform without an API key/login (used for both YT and FB):**
- YouTube: see below.
- **Facebook**: `curl -A "facebookexternalhit/1.1" <reel-or-video-url>` and grep
  `<meta property="og:(title|description|image)"`. Facebook serves full OG metadata
  server-side to the crawler UA — no login needed for public posts. Title format is
  `"<views> · <reactions> | <caption> | <Page Name>"` — check the Page Name matches the
  owner to confirm authorship. Some posts need a retry (transient empty response) or a
  slightly different UA string before the tags appear — don't give up after one miss.
  **`og:image` is a signed, expiring CDN URL — never hardcode it.**
  Watch for currency symbols: Bengali Taka `৳` is U+09F3, inside the Bengali Unicode block
  — write `Tk` instead if the site has an English-only rule.

**How the YouTube data was obtained (no API key):**
1. Load `https://www.youtube.com/@iamvishalagarwal/videos` in the browser pane.
2. IDs: `JSON.stringify(window.ytInitialData)` then regex `/"videoId":"([\w-]{11})"/g`.
   (The DOM is lazy — querying anchors returns nothing. Walking the JSON for paired
   titles also fails; the modern shape hides them.)
3. Titles/ownership: `https://www.youtube.com/oembed?url=…&format=json` per ID →
   `{title, author_name}`. Filter to `author_name === "Vishal Agarwal"`.

## Content integrity rules

- **Never invent testimonials/reviews.** Only 1 of the 5 Facebook recommendations is
  publicly readable (Saif Mahmud, 6 July) — the rest are behind a login wall. Ask the
  owner to paste the others; do not fabricate names/quotes.
- **Never edit a real person's quote.** Saif Mahmud's review contains "Bhai"; it stays
  verbatim despite the English-only rule, because rewriting a real review falsifies it.
  (The design's placeholder testimonial was reworded — it isn't a sourced quote.)
- Testimonials auto-scroll as a marquee (`.tmarquee` / `.tm-track`, duplicated set, pause on hover).

## Animations

Slide-in reveals (`.reveal[data-dir=left|right|up]` + IntersectionObserver), drifting
background objects (`.bg-fx` canvas), custom cursor (dot + trailing ring), magnetic
buttons, card tilt, rotated marquee bands. All gated on `prefers-reduced-motion` and
`(hover:hover)` — disabled on touch.

## Database — CONNECTED

Neon Postgres via the Vercel Marketplace integration (resource `neon-cerulean-tree`),
connected to project `vishal-site`. `DATABASE_URL` (+ the full `POSTGRES_*`/`PG*` var set)
is set for Production/Preview/Development. Confirmed live with a real insert returning
`stored:true`.

**How it was provisioned (fully CLI, no dashboard needed except one legal click):**
```
vercel integration discover neon        # find the marketplace slug
vercel integration add neon             # from the project folder
```
First call returns `action_required` / `integration_terms_acceptance_required` with a
`verification_uri` — that's a ToS acceptance and **requires the human** to open it and
click accept (the CLI says so explicitly: "Requires an interactive terminal and human
confirmation"). Once accepted, re-run `vercel integration add neon` — it provisions, **auto-connects
to the current project, and injects env vars** in one shot. Then `vercel deploy --prod --yes`
so the running functions pick up the new var. This generalizes to any Vercel Marketplace
resource (KV, Blob, etc.) — same two-step dance.

Schema — all created/migrated idempotently by `lib/db.js`'s `migrate()`:
- `waitlist(id, email, email_key, source, greeted_at, created_at)` — unique index on **`email_key`**
  (the canonicalized/deduped form), **not** on `email`. `migrate()` also backfills `email_key` for
  legacy rows and merges any duplicates it reveals.
- `contacts(id, name, email, message, created_at)`
- `orders(id, invoice UNIQUE, buyer_name, phone, address, city, email, qty, amount NUMERIC(10,2),
  currency, status, bkash_payment_id, bkash_trx_id, raw JSONB, created_at, paid_at)` — `status`
  walks `initiated → paid | cancelled | failed`; `invoice` is the idempotency key; indexes on
  `bkash_payment_id` and `status`.
- `visits(id, page, referrer, ua, visitor_key, created_at)` — one row per buy-page view;
  `visitor_key` is a **salted daily hash of IP+UA** (`VISIT_SALT`), so unique counts work and the
  raw IP is never stored. Indexes on `(page, created_at)` and `visitor_key`.
- `consultations(id, name, email, phone, topic, message, preferred_date, preferred_slot, status,
  scheduled_at, duration_min, meeting_url, meeting_provider, owner_note, invited_at, source,
  created_at, updated_at)` — `status` walks `new → accepted → scheduled → done`, or `declined`.
- `ebook_grants(id, token UNIQUE, order_id UNIQUE→orders, invoice, buyer_name, buyer_phone, email,
  revoked_at, created_at)` — one access link per paid order; `order_id UNIQUE` is what makes grant
  creation idempotent under a replayed bKash callback.
- `book_readers(id, reader_id UNIQUE, grant_token, name, phone, is_buyer, device_key, first_seen,
  last_seen)` · `book_events(id BIGSERIAL, reader_id, grant_token, kind, page, seconds, created_at)`
  · `book_progress(reader_id PK, grant_token, opens, max_page, pages_seen, seconds_total, downloads,
  total_pages, last_at)` — the rollup is what the dashboard reads; `book_events` is the raw audit.
- `orders` also gained `product TEXT NOT NULL DEFAULT 'print'`, and **`address` was made nullable**
  (`ALTER … DROP NOT NULL`) because an ebook has nowhere to ship.

Behaviour contract (do not weaken):
- no pool → real error to the client (waitlist: `503` with a friendly message; the old
  silent `200 {stored:false}` was pre-DB scaffolding, no longer needed now that DB exists)
- pool present but insert throws → **`500 {ok:false,error}`** (never pretend it saved)
- client `post()` throws unless `r.ok && body.ok === true` — forms must never fake success
- hidden `.hp` honeypot field on both forms; filled → silently accepted, not stored
- `lib/db.js` verifies TLS certs by default; escape hatch `PGSSL_NO_VERIFY=1`
- duplicate signup (same canonical mailbox) → `200 {ok:true, stored:false, duplicate:true,
  message}` — not an error, but not a fresh insert either
- no mail provider (`RESEND_API_KEY`/`MAILTRAP_API_TOKEN`) configured → greeting is
  `{sent:false, reason:'not_configured'}`; signups still succeed, this is by design

## Email sending — LIVE (16 July 2026)

**Resend**, domain `iamvishalagarwal.com` verified. Env on Production+Development:
`RESEND_API_KEY` and `MAIL_FROM="Vishal Agarwal <hello@iamvishalagarwal.com>"`.
Confirmed live: `greeted:true` + `greeted_at` stamped. Reply-To is `mvishal550@gmail.com`.

- **The Resend account is registered to a different address than Vishal's own.** Relevant if the
  owner should hold it.
- **`MAIL_FROM` is mandatory, not optional.** Resend requires `from` to be on a verified
  domain. Without it `lib/mailer.js` falls back to `onboarding@resend.dev`, which only
  delivers to the Resend account owner and **403s for every other recipient**:
  `"You can only send testing emails to your own email address (…). To send emails to other
  recipients, please verify a domain…"`. That 403 is a *validation* error — the key is fine.
  Diagnose greeting failures with `vercel logs <deployment-url> --json` and read
  `greeting email failed for … - resend_403: {…}`; the error body names the account owner.
- **`vercel env add MAIL_FROM preview` fails non-interactively** (wants a git branch; no repo
  here). Production/Development are set; preview deploys still fall back to resend.dev.
- `MAIL_FROM` is not a secret — safe to set via CLI. API keys are the owner's to enter.

**Bug found + fixed here:** `checkGmailLocal()` validated the *raw* local-part including any
`+tag` against `/^[a-z0-9.]+$/` — which rejects `+` — so every real Gmail `+tag` signup was
being refused with "Gmail addresses only contain letters, numbers and dots", even though the
file's own `PLUS_ALIAS`/`canonicalize()` logic exists specifically to accept and dedupe them.
Fixed by stripping the `+tag` before running that check. Verify with: insert `X@gmail.com`,
then `X+anything@gmail.com` should return `duplicate:true`, not a 400.

**The table must have NO `UNIQUE` on `email`.** With a unique index on both `email` and
`email_key`, a repeat of the *same literal* address violates the non-arbiter index and
Postgres raises `unique_violation` — a 500 — instead of letting
`ON CONFLICT (email_key) DO NOTHING` report it as a duplicate. `migrate()` drops the legacy
constraint (`ALTER TABLE waitlist DROP CONSTRAINT IF EXISTS waitlist_email_key`) for exactly
this reason. Uniqueness lives on `email_key` alone.

**Backfill `email_key` in JS via `canonicalize()`, never in SQL.** A second SQL
implementation of the gmail dot/plus rules drifts from the JS one silently. `migrate()`
selects the null-key rows, canonicalizes them in JS, then merges any rows that turn out to
share a key (keeping the earliest) — the unique index cannot build while collisions exist,
and a failed index build wedges `ensureSchema` into permanent 500s.

**Testing the DB without a DB:** `@electric-sql/pglite` runs real Postgres in WASM (no
Docker) — it caught both bugs above. Fake pool: `{query: (sql, params) => params ?
db.query(sql, params) : db.exec(sql)}` (exec for multi-statement DDL). Note `ensureSchema`
memoizes `schemaReady` in module scope, so a second in-process DB reuses the cached promise —
`delete require.cache[require.resolve('./lib/db.js')]` between scenarios or migrations
silently don't run. That's a test artifact, not a prod bug (one DB per process there).

## Expensive gotchas (learned the hard way)

**0. `vercel domains inspect` LIES about which project owns a domain.** Its "Projects" table
listed both `vishal-site` and the retired `vishal-portfolio` against `iamvishalagarwal.com` + `www`,
which reads as a dangerous double-claim needing a detach. It is not. The authoritative source is the
per-project API:
```bash
T=$(node -e "console.log(require('C:/Users/Susanta Podder/AppData/Roaming/xdg.data/com.vercel.cli/auth.json'.replace(/\//g,'\\\\')).token)")
curl -s -H "Authorization: Bearer $T" \
  "https://api.vercel.com/v9/projects/<project>/domains?teamId=team_85dqAI8mt0ZQW7Nh7Bz2EoBS"
```
Checked 1 Aug 2026: `vishal-portfolio` holds **only** `vishal-portfolio-eosin.vercel.app`.
`vishal-site` cleanly owns the apex + `www` (308 → apex), both verified. **There is nothing to
detach and no `_vercel` TXT record is needed.** Do not perform the risky domain move in gotcha 1
on the strength of the `domains inspect` output alone — check the API first.
Note the CLI auth token lives at `AppData/Roaming/xdg.data/com.vercel.cli/auth.json`, NOT
`~/.vercel` or `AppData/Roaming/com.vercel.cli`.

**1. Moving a domain between Vercel projects on third-party DNS took the site down ~20 min.**
Namecheap DNS → detaching the domain **resets verification**; Vercel then demands a
`_vercel` TXT record, and the domain 404s on **both** projects until it's added.
Re-attaching to the original project does **not** restore it. Tokens rotate on every
re-add. **Correct order: add the `_vercel` TXT record FIRST, then move.** Never detach a
live domain before the TXT exists. (`vercel storage` is not a CLI subcommand in 54.x.)

**2. Vercel "Sensitive" env vars cannot be read back.** `vercel env pull` returns
`DATABASE_URL=""` even though a value exists — so another project's connection string
can't be reused to auto-provision. Ask the owner instead.
*Exception:* the vars the **Neon integration injects into `vishal-site` are not sensitive** —
`vercel env pull .env.local --environment=production` returns a working `DATABASE_URL`, so
you can run the real schema/dedupe against prod Postgres locally. Delete `.env.local` after;
`.gitignore` covers it and Vercel falls back to `.gitignore` when there's no `.vercelignore`.

**3. Claude Design `.dc.html` exports are NOT deployable.** They use a proprietary runtime
(`<x-dc>`, `DCLogic`, `<sc-for>`, `<sc-if>`, `{{ }}`, `x-import` image slots). Read via the
`DesignSync` MCP (`get_project` / `list_files` / `get_file`), then **rebuild** as plain
HTML/CSS/JS. Treat the export as a spec, not code.

**4. `DesignSync.get_file` caps content at 256 KiB** → larger images come back
`truncated:true` and decode to corrupt files. Large tool results are auto-persisted to a
`tool-results/*.txt` file — decode those from disk with node (`JSON.parse` → `Buffer.from(content,'base64')`)
so the bytes never burn context.

**5. The in-app browser preview pane lies about this site.**
- `computer{action:"screenshot"}` **times out** on pages with continuous animation
  (marquee/canvas). It hung even on the original site — not a regression.
- `getComputedStyle` / `cssRules` return **stale or impossible** values (once reported
  `opacity:0` for an element with `opacity:1 !important`). Don't trust them.
- `img.complete` reads false while `naturalWidth` is correct — check `naturalWidth`.
- Viewport can't go below ~390–500px; `innerWidth` disagrees with `documentElement.clientWidth`
  (media queries follow clientWidth).
- **Therefore:** validate CSS with `npx lightningcss-cli@1 --minify style.css -o /dev/null`
  (exit 0 = valid), verify behaviour with small JS probes that do open→wait→read in **one**
  call (state doesn't survive across calls), and confirm shipped output with `curl`.

**6. Vercel checks the filesystem BEFORE `rewrites`.** A `rewrites` entry for `/admin` was silently
dead while `admin.html` existed — with `cleanUrls:true`, `/admin` resolves to the static file first
and never reaches the function. To route a clean path at a serverless function, **the same-named
static file must not exist**. (Order is roughly: headers → redirects → filesystem → rewrites.)

**7. `npx lightningcss-cli` sometimes hangs** (it re-resolves from the network). If a validation
step stalls past ~60s, kill it and fall back to a brace-balance sanity check
(`(s.match(/{/g)||[]).length === (s.match(/}/g)||[]).length`) plus a grep that the new rules exist.

**8. `day` is a reserved word in Postgres** — it cannot be a bare column alias.
`SELECT … date_trunc('day', created_at) day` throws `syntax error at or near "day"`; use
`AS ymd`. This shipped a 502 on `/api/order-stats` once.

**9. Session limits kill subagents mid-workflow.** A 7-lens audit lost 16/18 agents; a
`confirmedCount: 0` then means *verification never ran*, not "no bugs". Read
`journal.jsonl` in the workflow transcript dir to recover findings from agents that did
finish, and verify them inline.

## Verification recipe

```bash
# ---- validity (every JS file, not just the old three) ----
for f in style.css admin.css reader.css; do npx --yes lightningcss-cli@1 --minify $f -o /dev/null; done
for f in app.js bd-locations.js api/*.js lib/*.js lib/routes/*.js; do node --check "$f" || echo "SYNTAX FAIL $f"; done
node --input-type=module --check < reader.js        # ES module — plain --check rejects `import`
node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))"
node -e "['admin','book','order','forms'].forEach(n=>require('./api/'+n+'.js'))"   # every route resolves
ls api | wc -l                                       # MUST stay <= 12 (Hobby cap); 4 today

# ---- no regressions ----
grep -rlP '[\x{0980}-\x{09FF}]' index.html contact.html order.html app.js style.css   # Bengali must be absent
for S in "Beyond Borders" "1,000+" "6+ yrs" "Bishal"; do grep -rl "$S" . ; done
grep -c '<script' <(curl -s https://iamvishalagarwal.com/admin)   # must be 0 — admin stays JS-free
ls admin.html admin.js 2>/dev/null && echo "REGRESSION: client-side admin is back"

# ---- live: public ----
B=https://iamvishalagarwal.com
for u in / /contact /order /admin; do curl -s -o /dev/null -w "$u %{http_code}\n" $B$u; done
curl -sI $B/ | grep -i content-security-policy        # worker-src 'self' blob: must be present
curl -s $B/api/order-config                           # {configured, format, price, shipping, needsEmail}
curl -s -o /dev/null -w "%{http_code}\n" -X POST $B/api/track -H "Content-Type: application/json" -d '{"page":"order"}'   # 204
curl -s -X POST $B/api/consult -H "Content-Type: application/json" -d '{"name":"X","email":"bad","message":"hi"}'         # 400 + reason
curl -sI $B/vendor/pdf.min.js | grep -i content-type  # application/javascript
curl -s -o /dev/null -w "%{http_code}\n" $B/read/badtoken                                                                 # 404 page

# ---- live: admin (needs ORDER_ADMIN_KEY — `vercel env pull` returns it EMPTY, ask the owner) ----
K=<key>
curl -s -o /dev/null -w "%{http_code}\n" -X POST $B/api/admin-login -d "key=$K"   # 302 + Set-Cookie
curl -s -H "x-admin-key: $K" $B/api/order-stats | head -c 200                     # JSON stats (+ .book, .inbox)
curl -s -o /dev/null -w "%{http_code}\n" "$B/api/admin-view?key=$K"               # 200 HTML
curl -s -o /dev/null -w "%{http_code}\n" $B/api/order-stats                       # 401 unauthenticated

# ---- offline suites (pglite = real Postgres in WASM, no Docker, no network) ----
npm install @electric-sql/pglite --no-save
NODE_PATH="$PWD/node_modules" node <scratchpad>/ebooktest.js   "$PWD"   # 81 assertions
NODE_PATH="$PWD/node_modules" node <scratchpad>/consulttest.js "$PWD"   # 66 assertions
npm uninstall @electric-sql/pglite --no-save    # leaves node_modules/@electric-sql behind — rm it too
```

## Book payments — bKash PGW (built 27 Jul 2026, DORMANT until launch)

Full **bKash Payment Gateway (tokenized Checkout)** prepaid flow for the book, so payments land
directly in Vishal's bKash **merchant** wallet, verified server-side. Owner gets the merchant +
PGW API account ~1 week after 27 Jul. Built + tested against sandbox; **live but dormant** (buy
button hidden, `/order` noindex, endpoints 503 gracefully) until creds + the launch flag flip.

**Flow (URL-redirect, NOT iframe → CSP unchanged):** `/order` form → `POST /api/order-create`
(validates, computes amount **server-side** = `BOOK_PRICE_BDT*qty + BOOK_SHIPPING_BDT`, inserts
`orders` row `initiated`, bKash Grant-Token→Create-Payment, returns `bkashURL`) → browser
redirects to bKash hosted page → bKash redirects to `GET /api/bkash-callback?paymentID&status`
→ Execute-Payment, verify `transactionStatus==='Completed'` **and** `amount===order.amount`,
mark `paid` + trxID + `paid_at`, email buyer+owner, 302 to `/order?status=success`. Fail/cancel
→ `cancelled`/`failed`. `/api/bkash-status?key=ORDER_ADMIN_KEY&invoice=…` reconciles stuck orders
via Query-Payment (for lost callbacks — bKash may have taken the money even if our execute timed out).

**Files:** `lib/bkash.js` (mode switch, token cache+401-retry, create/execute/query/refund),
`api/order-create.js`, `api/bkash-callback.js`, `api/bkash-status.js`, `api/order-config.js`
(public read-only price so the page total can't drift from the server), `order.html` (`/order`,
reuses contact-page CSS; result panels driven by `?status=`), `lib/mailer.js` (now generic
`sendMail` + `sendOrderEmails`; `sendGreeting` unchanged), `lib/db.js` `orders` table,
`index.html` #book `data-onsale` flag + hidden `#book-buy`, app.js order IIFE + on-sale flip.

**Hard rules (never weaken):** amount is server-computed, never from client; execute re-verifies
amount before `paid`; callback is idempotent (replay-safe, one paid row); callback errors leave
the order `initiated` (NOT failed) so reconcile can finish it — the payment may have succeeded;
honeypot `website` field; bKash secrets are server-only.

**Env (owner sets in Vercel):** `BKASH_MODE` (sandbox→production), `BKASH_APP_KEY/APP_SECRET/
USERNAME/PASSWORD`, `BOOK_PRICE_BDT`, `BOOK_SHIPPING_BDT`, `SITE_URL`, `ORDER_ADMIN_KEY`. Reuses
`DATABASE_URL`/`RESEND_API_KEY`/`MAIL_FROM`. Base URLs: sandbox `tokenized.sandbox.bka.sh`, prod
`tokenized.pay.bka.sh`, both `/v1.2.0-beta/tokenized/checkout`. Create mode is `'0011'`. Success
= bKash `statusCode==='0000'`.

**Full env inventory (30 Jul):** set today — `DATABASE_URL` + the Neon `POSTGRES_*` set,
`RESEND_API_KEY`, `MAIL_FROM`, `BKASH_*` (sandbox), `BOOK_PRICE_BDT=3333`, `BOOK_SHIPPING_BDT=0`,
`SITE_URL`, `ORDER_ADMIN_KEY`, `VISIT_SALT`. Not set yet — `BOOK_PDF_URL`, `BOOK_FORMAT`,
`EBOOK_PRICE_BDT`, `READER_SECRET` (optional), `ZOOM_ACCOUNT_ID`/`ZOOM_CLIENT_ID`/
`ZOOM_CLIENT_SECRET` (optional), `ORDER_NOTIFY_EMAIL` (optional; defaults to mvishal550@gmail.com).

**Verified (27 Jul):** 25/25 offline integration assertions pass (pglite real Postgres + mocked
bKash HTTP): create→pay→verify→paid, idempotent replay, cancel, **amount-tamper rejection**,
validation, honeypot, reconcile, BD-phone normalization (`+880`/`880`/`01`/dashes). Live: `/order`
renders + config-gates the submit (disabled, "opens at launch" until creds), `?status=success`
shows the confirm card, endpoints 503 gracefully with no creds, homepage unchanged, CSP intact.
**Test harness lives in scratchpad `ordertest.js`** — needs `@electric-sql/pglite` (`npm i … --no-save`,
run with `NODE_PATH=<proj>/node_modules`). The one thing NOT self-verifiable = the live bKash
sandbox round-trip on bKash's hosted page (needs the owner's sandbox creds + a sandbox test wallet).

**Sandbox env IS set (28 Jul):** all `BKASH_*` + `BOOK_PRICE_BDT=3333` + `BOOK_SHIPPING_BDT=0` +
`SITE_URL` + `ORDER_ADMIN_KEY` set on Production+Development. **BLOCKER: bKash's public shared
sandbox creds are DEAD** — token/grant returns `9999 "Invalid or unrecognized access credentials"`.
The full path works (order-config `configured:true`, order-create reaches bKash and surfaces the
error as a graceful 502, a `failed` order row is stored). To finish the live sandbox test the
owner must paste **their own** bKash sandbox app_key/secret/username/password (merchant sandbox
portal); then swap the 4 `BKASH_*` vars + redeploy. `ORDER_ADMIN_KEY` for this deploy is saved in
the session scratchpad `admin_key.txt` (regenerate anytime — it only guards the stats/reconcile
endpoints).

**Added 28 Jul — city combobox, visitor tracking, admin stats:**
- **Searchable city/area dropdown** on `/order`: `bd-locations.js` (root, `window.BD_LOCATIONS`, 570
  English BD place names built from the `bangladesh-geocode` dataset — upazila "Area, District" +
  district names; NO Bengali). app.js combobox IIFE does prefix-then-substring filter, keyboard
  nav, ARIA combobox/listbox, free-text allowed (street stays a plain field). Verified live:
  "dhak"→Dhaka family, "cox"→Cox's Bazar.
- **Visitor tracking** (buy page): `visits` table + `api/track.js` (sendBeacon from app.js on
  `/order`; salted daily IP+UA hash `visitor_key`, raw IP never stored; always 204). Verified rows
  land in DB.
- **Admin dashboard data:** `GET /api/order-stats?key=ORDER_ADMIN_KEY` → orders by status +
  paid revenue + recent paid + buy-page total/unique/today/last-7-days. Token-protected.
  **SQL gotcha fixed:** `day` is reserved — can't be a bare column alias; use `AS ymd`.

## Admin dashboard — `/admin` (28 July 2026)

Owner-only view of orders + buy-page traffic.
- **FINAL ARCHITECTURE (v4): `/admin` is 100% server-rendered — there is no admin JavaScript at
  all.** `admin.html` and `admin.js` were **deleted** (backups in the session scratchpad) after
  three client-side builds all failed silently in the owner's Chrome — almost certainly an
  extension eating `admin.js`. Do not reintroduce a client-rendered admin.
  - `vercel.json` **rewrite `/admin` → `/api/admin-page`**. Vercel checks the **filesystem before
    rewrites**, so `admin.html` had to be deleted or it would keep winning at `/admin`.
  - `api/admin-page.js` (cookie session) and `api/admin-view.js` (`?key=` in URL) are thin wrappers
    over `lib/admin-handler.js` → `lib/admin-render.js` (HTML) + `lib/admin-data.js` (SQL).
  - Every action is a **plain link or form post, never a script**: Download CSV = `?format=csv`,
    reconcile = `?recheck=<invoice>` (via `lib/reconcile.js`, shared with `/api/bkash-status`),
    sign out = `/api/admin-login?logout=1`.
  - Only `admin.css` remains client-side (`?v=4`). Site CSP is `script-src 'self'` — inline
    `<script>`/`onclick=` are blocked anyway; inline *style attributes* are allowed.
- Auth (**cookie-session, v3 — works with JavaScript fully disabled**): `api/admin-login.js` +
  `lib/admin-auth.js`. The gate is a **real `<form method="POST" action="/api/admin-login">`**, so
  clicking Unlock signs in even if `admin.js` never executes. The endpoint validates the key and
  sets an **HttpOnly/Secure/SameSite=Lax `iva_admin` cookie** holding `"<expiryMs>.<hmac>"` —
  an HMAC of the expiry keyed by `ORDER_ADMIN_KEY`, never the key itself. `checkAdmin(req)` accepts
  **cookie → `x-admin-key` header → `?key=`** (in that order); comparisons sha256 both sides before
  `timingSafeEqual` so length never throws or leaks. Rotating `ORDER_ADMIN_KEY` invalidates every
  existing session for free. Also: `GET /api/admin-login?key=…` (magic link, no JS needed) and
  `?logout=1`. Wrong key with no JS returns a **server-rendered error page**, so the user always
  gets feedback.
- Contents: hero revenue figure · 4 stat tiles (paid orders, views, unique, conversion) · 14-day
  traffic table with CSS proportional bars · referrer table · orders table with full shipping
  addresses, a **Download CSV** link, and a **Check** link on `initiated` rows that reconciles
  against bKash. (The old SVG chart / live search / copy-button died with `admin.js` — if any is
  ever wanted back, add it as *progressive enhancement* that the page works fine without.)
- **Escaping is now server-side: every buyer-supplied value goes through `esc()` in
  `lib/admin-render.js`** before it lands in the HTML string. (An earlier note here said "always
  `textContent`, never `innerHTML`" — that applied to the deleted `admin.js`. The rule survives, the
  mechanism changed: **never interpolate an order field into admin HTML without `esc()`**.)
- The admin views return buyer PII (address/phone) **by design** — the owner ships from it. That is
  exactly why they stay behind the admin key, `no-store`, and `noindex`. `vercel.json` sends
  `X-Robots-Tag: noindex, nofollow` + `no-store` for `/admin` (and noindex for `/order`); the
  rendered pages carry a robots meta too.
- **Historical, for if a chart ever returns:** the dataviz palette was computed, not eyeballed —
  views `#c8801a` + unique `#39a0c9` on surface `#2a3317` passes all six checks (CVD ΔE 21.4,
  normal 24.2), while brand `--amber #ee9d24` **fails** the dark-mode lightness band (L 0.759 >
  0.67 cap). Re-validate before changing:
  `node scripts/validate_palette.js "#c8801a,#39a0c9" --mode dark --surface "#2a3317"`.
  Today the traffic panel is a plain table with CSS proportional bars — no palette needed.
- **`GET /api/admin-view?key=…` — the zero-JS, zero-cookie route**, kept alongside `/admin` for
  locked-down browsers and in-app webviews. Same renderer; the key rides in the URL (unavoidable
  without JS or cookies), so the response sets `no-store`, `noindex`, and **`Referrer-Policy:
  no-referrer`** so the key can't leak via `Referer`.

**The login saga — read this before touching admin auth (it cost four builds).**
The owner could not sign in. Three successive *client-side* builds all failed the same silent way,
while every server check passed:
1. **v1** localStorage + `x-admin-key` header → "clicking Unlock does nothing."
2. **v2** hardened the client — `?key=` one-click link with `history.replaceState` scrubbing,
   `sanitize()` against 7 paste-corruption cases, Show/Hide + character counter,
   `autocomplete="off"`/`data-1p-ignore` against password managers, `friendlyError()` for
   401/503/network → still nothing.
3. **v3** moved auth server-side (form POST + HttpOnly cookie) but kept `admin.js` for rendering →
   still nothing.
4. **v4 — deleted `admin.js` entirely and server-rendered everything.** Works.

Diagnosis that actually mattered: *"nothing happens, and no error either"* is the signature of the
**page's JavaScript never executing** (extension/cache), not of a wrong key. The owner was on
ordinary desktop Chrome, and the zero-JS view worked while the JS one didn't — that isolates it to
a script blocker. **Lesson: when a login silently does nothing, stop hardening the client; render
it on the server.** A secondary win — HttpOnly cookie beats localStorage on security anyway.

**Diagnostic order for any future "can't log in / can't see data":**
```bash
curl -H "x-admin-key: <key>" .../api/order-stats                 # auth + DB     (expect 200)
curl -X POST .../api/admin-login -d "key=<key>" -i               # no-JS login   (expect 302 + Set-Cookie)
curl -s .../admin | grep -c '<script'                            # expect 0
```
If those pass, the bug is in the browser, not the code. **`vercel env pull` returns
`ORDER_ADMIN_KEY=""`** — added vars read back empty, so that is NOT evidence the var is unset.

Verified live (28 Jul, v4): `/admin` signed out → server-rendered login, **0 `<script>` tags**;
form POST → 302 + cookie → `/admin` 200 showing revenue/tiles/traffic/referrers/orders, still 0
scripts; `?format=csv` → `text/csv` with a BOM; wrong key → 401 "Key not accepted" page (never
silence); `?logout=1` → 302 + cookie cleared → login again; `/api/admin-view?key=…` + its CSV → 200;
JSON `/api/order-stats` unaffected. Auth unit tests: valid/tampered/expired/garbage token, cookie
vs header, messy-paste key, and **token invalidated by rotating `ORDER_ADMIN_KEY`** — all pass.

**Go-live (when merchant+API creds land):** set prod `BKASH_*` + `BKASH_MODE=production` + real
prices in Vercel; bKash runs a **go-live/UAT review of the integration** (their gate, not
self-serve); flip `#book` `data-onsale="true"` + deploy; do one small real txn, confirm it hits
the merchant wallet + order `paid`, then `refundPayment` it. Plan file:
`~/.claude/plans/so-let-s-talk-about-mossy-bengio.md`.

## Ebook delivery + reading analytics (built 30 Jul 2026, live but DARK)

Sells and delivers *Prothom Container* as a PDF, and measures who actually reads it. Everything is
deployed and verified; it switches on with two env vars.

**The chain:** paid ebook order → `lib/ebook.js` `grantForOrder()` mints a 32-hex token (idempotent,
`ebook_grants.order_id` is UNIQUE, so a replayed bKash callback can't issue two links) → the buyer
gets `/read/<token>` three ways: the receipt email, the `?k=` on the success page, and
`/api/resend-book` ("I lost my link", answers identically for a buyer and a stranger so it can't be
used to probe who bought) → `/read/<token>` asks **name + phone once per device**, sets a signed
HttpOnly `iva_reader` cookie, then serves a PDF.js reader.

**Design decisions worth not re-litigating:**
- **Sharing is expected and fine** — the grant means "this copy", the reader means "this person".
  One grant with many readers is the point: `readers ÷ links` is the reach multiplier on the dashboard.
- **`open` is recorded server-side in `read.js`**, never by the client, so it still counts when a
  reader's JavaScript is blocked. Only page position and time can come from the browser.
- **One page at a time, not continuous scroll** — "which page is this reader on" then has exactly
  one answer. Continuous scroll makes every reading number a guess.
- **Heartbeats are visibility-gated** (`document.visibilityState`) and clamped to ≤120s per beacon,
  so a forgotten background tab and a forged payload both fail to inflate reading time.
- **"Finished" needs BOTH ≥90% of pages AND ≥5 minutes** (`FINISH_PAGE_RATIO`/`FINISH_MIN_SECONDS`
  in `lib/ebook.js`, published on the dashboard). Dragging to the last page is not reading.
- **A downloaded PDF is invisible** — that limit is printed on the admin card, not left for the
  owner to discover by wondering why "finished" looks low.

**The 4.5 MB wall.** A Vercel function response body is hard-capped at 4.5 MB
(`FUNCTION_PAYLOAD_TOO_LARGE`). So `book-file.js` **only ever serves byte ranges**: it forwards the
client's `Range` to `BOOK_PDF_URL`, and when a request arrives with *no* Range it asks for the first
3 MB anyway and answers `206` + `Content-Range` — which is precisely the signal PDF.js uses to learn
the total length and switch to ranged fetching. The full-file *download* dodges the cap entirely by
recording the event and then 302-ing to storage with `?download=1`.

**PDF.js is vendored, not CDN'd** — CSP is `script-src 'self'`. CSP also needed
`worker-src 'self' blob:` and `blob:` in `img-src`.

**Env to switch it on:** `BOOK_PDF_URL` (Vercel Blob public store; the URL is server-only and never
reaches the browser), `BOOK_FORMAT=ebook`, `EBOOK_PRICE_BDT`. Optional `READER_SECRET` (falls back
to `ORDER_ADMIN_KEY`, so rotating that key signs every reader out).

**Verified 30 Jul:** 81 offline assertions (pglite) + **23 live assertions against production** —
gate renders, bad phone refused with a reason, cookie set HttpOnly/Secure/SameSite, reader shell
names the reader, `open` counted with no JS, beacons stored, an unauthenticated beacon ignored,
bytes refused without a cookie, resend indistinguishable. The live harness creates a throwaway
order+grant and **deletes everything it made** — see scratchpad `livecheck.js`.
**Not yet verifiable:** the actual PDF rendering, because there is no book file yet.

## Consultations — booking + owner panel (built 30 Jul 2026, LIVE)

**The problem it fixed:** `/contact`'s form was headed "Book a 1:1 trade consultation" but was a
plain name/email/message box that wrote to `contacts` and **notified nobody**, and no admin view ever
showed that table. On 30 Jul there were **8 rows sitting unread**, including real import/export
enquiries going back to 22 July. Those now surface under "Older messages" in the dashboard.

- **`/contact` is a real booking form**: name, email, optional phone, topic (6 options), preferred
  date, preferred time-of-day, message. Posts to `/api/consult`.
- **The owner is told immediately** (`sendConsultNew`) and the requester gets an acknowledgement.
- **`/admin` → Consultations card**: tiles (waiting on you · accepted · upcoming · completed), a
  table sorted **`new` first and `declined` last** because it is a to-do list, and a per-row
  `<details>` **Handle** editor — date/time, length, meeting link, note, and five submit buttons
  (Confirm & send invite · Save only · Accept · Mark done · Decline).
- **Still zero JavaScript.** `<details>` opens without script; the editor is a real `<form
  method="POST">`; multiple submit buttons carry `name="action"`. `lib/admin-handler.js` handles
  POST, runs `lib/consult-actions.js`, and re-renders with a **notice bar** — a click is never
  answered by silence, and the notice says plainly when a booking saved but the email failed.
- **Times are Bangladesh time end to end.** `parseDhakaLocal()` / `inDhaka()` in `lib/consult.js`;
  never let a naive datetime reach the DB — an appointment silently six hours out is worse than none.
- **The invite carries a `.ics` attachment** so the call lands in the guest's calendar. ICS is
  CRLF-only with escaped commas — calendar clients reject the file outright otherwise.
- **Meeting links:** paste any link (Zoom, Google Meet, anything) — or, if `ZOOM_ACCOUNT_ID` +
  `ZOOM_CLIENT_ID` + `ZOOM_CLIENT_SECRET` are set, tick the box and `lib/zoom.js` creates the meeting
  via **Server-to-Server OAuth** (no per-request consent, works from a serverless function; Zoom app
  scope `meeting:write:meeting:admin`). A Zoom failure never loses the booking — the time is saved
  and the notice says to paste a link by hand.
- Google Meet auto-creation is **not** built: it needs Google Cloud OAuth against the owner's
  Calendar, which is a much heavier setup than pasting a Meet link.

**Verified 30 Jul:** 66 offline assertions + live (booking validation, honeypot, `/contact` fields,
0 script tags, accept/save against the production DB with cleanup). **Not exercised live:** the
invite and decline emails, because sending one would put a fake booking in the owner's real inbox.

## `/landed` — Bangladesh landed-cost calculator (31 Jul 2026)

Source of truth is the **standalone repo `Desktop/claude/landed`**, deployed separately to
`landed-sigma.vercel.app`. `vishal-site/landed/` is a **generated copy** — never hand-edit it.

```bash
cd vishal-site && node sync-landed.js    # copies + rewrites paths, then deploy
```

### Why the sync script exists (do not delete it)

Standalone Landed is served at `/`, so relative `assets/app.js` is correct there. Mounted at
`/landed` **with no trailing slash**, the browser resolves that same relative path against `/` and
requests `/assets/app.js` → 404. Result: no CSS, no JavaScript, a completely dead page that still
returns 200. `sync-landed.js` rewrites `"assets/` → `"/landed/assets/` in the markup **and**
`fetch('assets/` → `fetch('/landed/assets/` in `app.js` (the tariff loader). It exits non-zero if
any relative path survives.

### The tariff data

`assets/tariff.json` — **7,465 HS codes** extracted from the official
[NBR / Bangladesh Customs Operative Tariff FY2026-27](https://customs.gov.bd/files/Tariff-2026-2027(11-06-2026).pdf)
(published 11 Jun 2026, found on the customs.gov.bd homepage). 612 KB raw, ~109 KB brotli, lazy-loaded.

**The formula is verified against the government's own arithmetic.** The PDF publishes NBR's computed
TTI per line; our cascade matches on **all 7,413 rows that carry a readable one**. Do not "fix" the
cascade without re-running that check.

```
CIF = FOB + Freight + Insurance ;  AV = CIF + 1% landing charge
CD  = AV×cd    RD = AV×rd    SD = (AV+CD+RD)×sd
VAT = (AV+CD+RD+SD)×vat      AT = (AV+CD+RD+SD)×at     AIT = AV×ait
```

**Refresh each fiscal year (July).** Re-run the extractor in the scratchpad against the new PDF.
FY2025-26 rates are already wrong: AT moved to **7.5%**, and RD is **5%** (not 3%) where CD is 25%.

### ⚠️ ~48 lines are SPECIFIC duties, not percentages

Sugar (1701xx), bitumen (2713), gold (7108), **all iron and steel scrap** (7201-7207, 8908) and the
whole Chapter 98 baggage regime carry a **fixed taka amount per tonne/gram/unit** in the same column
as the ad-valorem rates — e.g. `VAT 1800`, `AIT 600`, `CD 90000`. Treating those as percentages
computes VAT at 1800%. `specificOf()` in `app.js` flags any rate `> 100` and **refuses to autofill**.
SD is exempt from that test: a genuine ad-valorem SD reaches **500%** on >4000cc cars (TTI 1007.5%).

## `/community` — the platform surface (redesigned 31 Jul 2026)

**Positioning:** a connectivity platform for **free trade education, with the tools built in** — not
a login page for a calculator. The first version was a bare two-form gate and the owner rejected it.

**It is the one DARK surface on the site**, and deliberately so: `--bg #0E120C` with the existing
amber `#F0A62F` and a leaf green, i.e. a dark mode *of the brand*, not a second brand. Dark is
functional here — the tool cards glow, and glow needs a dark ground.

- `community.css` owns the tokens. `garmentmind.css` piggybacks on them, so **editing the `.cmy`
  token block changes /garmentmind too**
- Bento tool grid on a 6-column track (`--wide` 4, `--tall` 2, `--half` 3), collapsing to one column
  under 900px. Cards carry a pointer-tracked spotlight via `--mx`/`--my`
- `community.js` is the ONLY JavaScript, ~30 lines, pure progressive enhancement. Without it the
  cards keep `--mx: 50%` and glow from the centre. It is an external file because the site's CSP is
  `script-src 'self'`
- Scroll reveals use `@supports (animation-timeline: view())`, so unsupported browsers render
  everything visible rather than blank. Everything collapses under `prefers-reduced-motion`

**⚠️ Do not put `overflow-x: hidden` on `.cmy`.** It makes `<body>` a scroll container and kills
`position: sticky` on the header. The hero contains its own bleeding light-pools with
`overflow: clip`, which does not create a scroll container.

Stats on the page must stay real (7,465 = the tariff line count). No invented metrics.

## `/community` — member accounts + saved calculations (31 Jul 2026)

`lib/routes/community.js` + `lib/member-auth.js`, router `api/community.js`, styles `community.css`.
Tables: `members`, `member_calcs`. Zero JavaScript on every page, same rule as `/admin`.

- Passwords: **scrypt** (`scrypt$N$salt$hash`), never stored, logged or emailed
- Session: signed HttpOnly cookie `iva_mem`, `<id>.<exp>.<hmac>`, **30 days** (deliberately longer
  than the 12-hour admin session — it guards only that member's own saved calculations)
- Email confirmation, forgotten-password reset (1-hour links), 10-attempt account lock, honeypot
- `?do=list` / `?do=save` are the JSON endpoints Landed's **Save to my account** button uses. That
  button only renders when `location.pathname` matches `/landed`, so the standalone deploy never
  promises something that cannot work
- Members, confirmed counts and saved-calculation totals appear in **`/admin/master`**

**`MEMBER_SECRET` is not set**, so member sessions are currently signed with `ORDER_ADMIN_KEY` —
which means **rotating the admin key signs out every member**. Set `MEMBER_SECRET` to decouple them.

### ⚠️ `verifyEmail()` returns `{valid, reason}` — NOT `{ok}`

Checking `chk.ok` is always `undefined`, so **every signup on earth gets rejected** with a plausible
error message. Cost a full deploy cycle. Same trap applies anywhere `lib/verify-email.js` is used.

## Admin security overhaul (31 Jul 2026)

`lib/admin-guard.js`, `lib/routes/admin-master.js`, tables `admin_devices`, `admin_audit`,
`admin_config`. Verified by 39 offline assertions (pglite) plus a live 12-attempt lockout run.

### Sign-in: the KEY once per browser, the PASSWORD every time (1 Aug 2026)

Owner's rule: "after someone logs in with the admin key, from then on they use the admin password."
Implemented **per device**, not globally.

- `admin_devices.key_verified_at` is stamped when a device presents the correct key.
- `keyTrusted(device)` in `admin-guard.js` → true while the stamp is under `KEY_TRUST_DAYS` (90)
  **and** the device is `active`. `admin-page.js` uses it to render a password-only gate.
- **`trusted` is only ever computed as `pwRequired && keyTrusted(device)`.** With no
  `ADMIN_PASSWORD` set, "password only" would mean *no credential at all* and the device cookie
  would become the entire login. Never drop that guard.
- A trusted device may still send a key — and if it does it must be **right**. Never silently
  ignore a wrong key just because the device is trusted.
- Blocking, revoking, or `rotateAdminKey()` all clear the stamp (`clearAllKeyTrust`), so a rotated
  key cannot be bypassed by a browser that was trusted under the old one.
- Only typing the key renews the 90 days; signing in on the password does not extend it.

Verified by 26 offline assertions (pglite) — scratchpad `authtest.js`.

### ⚠️ Presence = GRANTED access, never a sign-in attempt (1 Aug 2026)

`H.touch()` in `routes/admin-master.js` used to run **before** `H.evaluate()`, so merely reaching
the master gate with a valid key reset that member's dormancy clock *even when the panel refused
them*. That gave a locked-out member a permanent veto: rank 2, unable to enter while rank 1 was
active, still reset their own clock on every attempt and so froze rank 3 out of succession forever.
`touch()` now runs only after `evaluate()` returns `allow`. Plain `/admin` logins never counted as
presence and still do not. Assertion 9c in `authtest.js` guards this — do not move the call back.

| Before | Now |
|---|---|
| Key only | Key **and** `ADMIN_PASSWORD` (key once per device, then password) |
| 30-day session | **12 hours** (`SESSION_MS` in `admin-auth.js`) |
| `GET ?key=…` magic link | **removed**, returns 400 |
| No failure tracking | 10 failures **block that device**; email alert at the 3rd |
| No audit | `admin_audit` records actor, action, device, detail, approver |

### Master succession hierarchy (`lib/master-hierarchy.js`, 31 Jul 2026)

One seat, a ranked line behind it. Tables `master_members`, `master_seat`, `master_grants`.
Verified by 37 offline assertions.

- Rank 1 is the owner, seeded from `MASTER_ADMIN_KEY` + `MASTER_OWNER_EMAIL`
- A member is blocked while **anyone above them** has been seen inside `DORMANT_DAYS` (15)
- Rank N needs **every** rank above it dormant, not just the seat holder
- A higher rank signing in takes the seat back instantly; the lower rank is locked out again
- The seat holder can grant someone **below** them concurrent access, capped at 72h
- Every handover is audited and **emailed to the whole line**, so succession is never silent
- A **suspended** higher rank does not block succession, even if recently active

**⚠️ Email is NOT the credential.** The brief said succession passes "to the next Gmail". Taken
literally, whoever controls that mailbox inherits everything after 15 quiet days, making the weakest
mailbox in the list the security of the whole system. Implemented so the email identifies and
notifies; the credential is that member's own master key, issued from the panel and shown once.
**Do not "simplify" this into email-only succession.**

Rank 1 issuing itself a key via `setOwnKey` **retires the env-var fallback permanently** (tested).

### Why blocking is per-DEVICE and never per-key

The obvious rule ("kill the admin key after 10 bad attempts") turns a public URL into a
denial-of-service switch: any stranger who finds `/admin` burns ten attempts and locks the owner out,
repeatedly, forever. **Do not "improve" this into automatic key rotation.** Rotation is a deliberate
act from `/admin/master`; the new key is shown once and stored only as a hash in `admin_config`.

### ⚠️ `activeKeyHash()` must FAIL CLOSED

It originally swallowed DB errors and fell back to `ORDER_ADMIN_KEY`, so a momentary database hiccup
after a rotation would **resurrect the rotated-out (possibly leaked) key**. It now returns
`{ok:false}` on any error and `adminKeyMatches()` refuses. Never reintroduce a silent env fallback.

### Secrets

`MASTER_ADMIN_KEY` + `ADMIN_PASSWORD` live in `Desktop/VISHAL-MASTER-KEYS/MASTER-KEYS.txt` on the
owner's machine only. They were generated locally and piped into Vercel without ever being printed.
**Never echo them, never ask for them, never write them into a transcript.** There is no recovery
path if the file is lost — that is deliberate. `ADMIN_ALERT_EMAILS` (comma separated) adds alert
recipients beyond the owner.

## `/invoice` — the invoice generator (1 Aug 2026)

`invoice.html` + `invoice.css` + `invoice.js`, carded into `/community` (`bill` icon). Served by
`cleanUrls`, **no rewrite and no function** — it is pure static, all state in `localStorage`
(`iva_invoice_v1`), nothing ever sent anywhere. Ported from the standalone Vercel project
**`quickbill`** (`Desktop/Claudes website choice/quickbill`, single `index.html`).

### ⚠️ The port is not a copy — the original is CSP-incompatible

QuickBill used one inline `<script>` block plus `onclick=` / `oninput=` attributes. Under this
site's `script-src 'self'` **every one of those is refused**: the page renders perfectly and does
absolutely nothing. Same silent failure that killed the client-rendered admin panel. All logic is
now external `invoice.js` bound with `addEventListener`. If you ever re-sync from the standalone
app, redo that conversion — do not paste its markup in.

Currency list spells Taka **`Tk`**, never `৳` (U+09F3, Bengali block — the site is English-only).
The same glyph was found and fixed in `lib/routes/community.js`'s `bdt()` at the same time.

Design: dark brand chrome, **white invoice sheet**. An invoice gets printed — a dark sheet either
wastes a cartridge or prints wrong. `@media print` strips the chrome and leaves the sheet.

Verified live in-browser: 10 × 250 = Tk 2,500, +15% tax, −5% discount → **Tk 2,750**; add-row,
paid stamp, autosave and currency switch all work; zero console errors.

## `/community` — the WebGL trade globe + 3D cards (1 Aug 2026)

`community3d.js` (`?v=3`) + the appended block in `community.css` (`?v=5`) + tilt in
`community.js` (`?v=4`). Hand-written WebGL, no library — CSP is `script-src 'self'`.
Scene: a Fibonacci-sphere point globe, six real lanes out of Dhaka (Guangzhou, Chennai, Ho Chi
Minh, Beijing, Dubai, Singapore) with a pulse travelling along each, and a lit lamp at every port.
Cards get a real perspective tilt (`--rx`/`--ry`, ±7°) plus `--tz` lift; all of it degrades to the
old flat cards with JS blocked.

### ⚠️ THE THREE BUGS THIS COST — check these first in any future WebGL here

1. **The depth term never reached 1.0.** `vDepth = clamp((mv.z + 4.3) / 1.9, …)` with the camera at
   `translate(-4.3)` and a unit sphere gives `mv.z ∈ [-5.3, -3.3]`, so the expression peaked at
   **0.53** — every point permanently at half brightness and half size. Correct mapping covers the
   whole span *including the lifted arcs* (radius up to ~1.38): `clamp((mv.z + 5.4) / 2.2, 0, 1)`.
   Measured effect: lit pixels 1,350 → 19,350, max alpha 47 → 209.
2. **`gl.lineWidth()` DOES NOTHING.** `ALIASED_LINE_WIDTH_RANGE` reads `[1, 1]` on ANGLE/D3D11
   (the owner's AMD Radeon, and most Windows GPUs), so `LINE_STRIP` arcs are hairlines forever — six
   lanes contributed **87 pixels** against the globe's 19,000 and were effectively invisible.
   **Never draw a visible line in WebGL with LINE_STRIP.** The lanes are now dense round POINT
   sprites along the same curve (320 per lane); `gl_PointSize` is honoured everywhere.
   Measured effect: amber pixels 87 → ~800, max alpha 115 → 255.
3. **`overflow: hidden` flattens `preserve-3d`**, so child `translateZ` inside `.tool` does nothing.
   Inner depth is counter-parallax `translate3d` driven by the same `--rx`/`--ry` instead.

Also: a `transform` transition fights a pointermove that rewrites transform every frame — the card
lags like syrup. `community.js` adds `.is-tilting` on pointerenter, whose rule drops `transform`
from the transition list, and removes it on pointerleave so it eases back to flat.

### How to actually verify WebGL on this site — `?glcheck=1`

The preview pane runs `visibilityState: 'hidden'`, fires **0 rAF frames**, and reports
`innerWidth: 0` so every `vw` collapses to a 0×0 canvas. On top of that `readPixels` outside the
drawing frame returns an empty buffer (`preserveDrawingBuffer` is false), so **"0 lit pixels" proves
nothing**. `community3d.js` therefore exposes a hook *only* when the URL carries `?glcheck=1`:

```js
c.style.width = '760px'; c.style.height = '760px';   // vw is 0 in the pane — pin a real size
window.__cmyGL.drawOnce(2.0);                        // paint synchronously
gl.readPixels(...)                                   // SAME task → buffer not yet composited/cleared
```
Count lit pixels, max alpha, amber pixels (`R > B+25 && R > G+12` — a looser test counts the cream
globe dots, whose R241/B233 also leans "warm"), and the centroid of hot amber pixels across several
`t` values: **6 distinct centroids from 6 samples proves the pulses travel.** Verified absent for
real visitors: `window.__cmyGL` undefined and `preserveDrawingBuffer: false` without the flag.

**The main site has no `Tools` nav link any more** (owner removed it 1 Aug 2026), so `/community`,
`/landed`, `/garmentmind` and `/invoice` are no longer reachable from the home page — reach them
directly or from each other's headers. Do not "helpfully" add it back.

## ⚠️ The home page is OFF LIMITS unless the owner names it (1 Aug 2026)

On 1 Aug a "make it insane — motion graphics, 3D animation, hover effects, glow, background
image" brief was read as applying to `index.html`. It was not. **The owner had never asked for the
main iamvishalagarwal.com site to be touched** and asked for it back exactly as it was. A hand-
written WebGL globe hero (`hero3d.js`) plus a dark "night hero" CSS block were built, shipped, and
then fully reverted the same day — `hero3d.js` deleted, the appended `style.css` block removed, the
canvas + script tag pulled from `index.html`, `theme-color` restored to `#333e1c`,
`style.css?v=25`.

**The rule now: the public marketing pages — `index.html`, `contact.html`, `order.html` and
`style.css` — are not redesigned unless the owner names that page.** Design asks in this project
have consistently meant the *tool surfaces* (`/community`, `/landed`, `/garmentmind`, `/invoice`),
which is where the dark theme and the glow already live. When a design brief arrives without a
named page, **ask which surface before writing any CSS** — the revert cost more than the question
would have.

The globe itself worked (geometry verified by 22 assertions, shaders compiled and linked live) and
is recoverable from this session's history if it is ever actually wanted. Do not reinstate it
speculatively.

## `/garmentmind` — L/C discrepancy checker landing page (31 Jul 2026)

`garmentmind.html` + `garmentmind.css`, reusing the `.cmy` tokens from `community.css`. Links out to
the live app at **`https://garmentmind.iamvishalagarwal.com`** (that app lives in `Desktop/Garment`;
see the `garmentmind` skill).

**The subdomain, not a path (1 Aug 2026).** The owner first asked for
`iamvishalagarwal.com/garmentmind-app`. That cannot work as a simple proxy: GarmentMind's built
assets are absolute (`/assets/index-<hash>.js`) and **vishal-site already owns `/assets/*`**, so the
proxy would serve the app's HTML and then 404 its JavaScript — a 200 response and a white page. The
hashes also change on every GarmentMind rebuild, so pinning individual filenames would silently
break later. A path mount needs the Garment app rebuilt with a Vite `base` + FastAPI `root_path`;
until someone does that, keep the subdomain. Adding it was: `cd Desktop/Garment && vercel domains
add garmentmind.iamvishalagarwal.com` (must run from the folder linked to that project — passing the
project as a second argument is rejected), then one `A` record at Namecheap. Verified live: React
mounts, assets 200, HTTP 308 → HTTPS, no console errors. `garmentmind.vercel.app` still works. Honest about status: "live and in use, and still being built", explicitly not a
replacement for the bank's checker and not UCP 600 legal advice. Keep it that way.

## Open TODOs

**Blocked on the owner**
1. **bKash credentials — the one thing gating launch.** Code is complete and tested; bKash's public
   shared sandbox creds are dead. Need the owner's **own** sandbox `app_key`/`app_secret`/`username`/
   `password`, then production creds once the merchant account clears. Owner must also confirm bKash
   enables the **PGW / tokenized Checkout API**, not just a send-money merchant number.
2. **The book PDF file + ebook price.** Nothing about the reader can be proven live without the
   file. Upload it to a Vercel Blob store (`vercel blob store add`, `vercel blob put`), set
   `BOOK_PDF_URL`, `EBOOK_PRICE_BDT`, then `BOOK_FORMAT=ebook`, and redeploy.
3. **Shipping fee** — currently `BOOK_SHIPPING_BDT=0` (free/included). Owner has not confirmed
   whether to charge delivery, or whether delivery is BD-wide or Dhaka-only. Moot while
   `BOOK_FORMAT=ebook`.
4. **Zoom Server-to-Server app** (optional) — three env vars turn on automatic meeting links.
   Without them the panel still works; the owner pastes a Meet/Zoom link.
5. **The 8 unread consultation enquiries** (22–30 Jul) now visible under "Older messages" in
   `/admin` — real people asking about imports, customs, spices and rice export. They were never
   answered. Worth telling the owner about, not just listing.
6. **Instagram/TikTok videos** — no posts yet; they sit behind the **More ▾** dropdown as empty
   states. Need post URLs (same self-host pattern as the Facebook reels).
7. **Remaining 4 Facebook reviews** — only 1 of 5 was publicly readable. Need the owner to paste
   the rest. **Do not invent.**
8. Resolve the "5 COUNTRIES" (only 4 named) / "4 VENTURES" vs "4+ BUSINESSES" wording.

**Ours to do when asked**
9. **Flip the book on sale at launch** — `index.html` `#book` `data-onsale="true"` reveals the
   hidden `#book-buy` → `/order`. One attribute + deploy.
10. Optional: real rate limiting on `/api/*` (needs KV) — only a honeypot today.
11. Optional: Google Meet auto-creation via the Calendar API (needs Google Cloud OAuth on the
    owner's account). Pasting a Meet link works today.
12. Optional: re-add admin niceties (chart / live search / copy-address) **only as progressive
    enhancement** the server-rendered page still works without.
13. `assets/venture-cement.jpg` still shows competitor brands (SHAH/KING CEMENT) — owner said ship
    it; swap + bump `?v=` if a brand-free photo ever arrives.

## Venture photos — DONE (17 July 2026)

Four real photos fill `.venture-media` (was gradient `tone-x` + faded word + line-icon).
Each card: `<img class="venture-img">` (the deleted `.v-native`/`.v-ic` are gone — don't
reintroduce), `.v-tag` route pill kept on top, `.venture-media::after` top scrim for pill
legibility, `tone-1..4` gradients retained only as load-failure fallback. Files are 1024x559,
panel is `aspect-ratio:16/10` so `object-fit:cover` crops a sliver of sky/floor — fine.

**Owner-flagged and shipped anyway:** the cement photo (`venture-cement.jpg`) has **SHAH CEMENT**
and **KING CEMENT** (competitor brands) printed on the bags — directly against the "no cement
brand name" rule. Flagged clearly; owner chose "deploy as-is" on 17 Jul. If a brand-free cement
photo arrives, swap `assets/venture-cement.jpg` and bump its `?v=`. The education photo has
slightly garbled baked-in "PROTHOM CONTAINER"+Bengali (AI-art) — acceptable to owner.

**Previewing before deploy (screenshots are dead here):** `computer{screenshot}` times out on
this site even with animation stripped — it's the pane, not the site. Two working paths: (1)
`vercel deploy --yes` (no `--prod`) → a real preview URL; it 302s for you (not authed) but the
owner passes Vercel SSO in their own browser. (2) A self-contained **Artifact** with images
inlined as base64 data URIs (CSP blocks external hosts, so inline everything; no Google-Fonts
CDN → Poppins falls back to system stack, fine for review). The Artifact is the only path you
can verify yourself. Build a temp preview file? Put it in scratchpad, NOT the project folder —
a stray `_preview*.html` there ships to prod on the next deploy.

## Media / video widget — DONE (17 July 2026)

`app.js` media IIFE + `#video-grid` + `#vmodal`. Chips are **YouTube · Facebook · More ▾**; the
More dropdown (`.chip-more` / `.chip-menu`, `role=menuitemradio`) holds Instagram + TikTok (still
empty states). `selectTab()` drives everything; menu items and chips both carry `data-tab`.

- **FB reel thumbnails are self-hosted** (`assets/fb-<id>.jpg`), NOT the gradient fallback and NOT
  FB's CDN URL (those `oh=/oe=` sign-expire). To (re)fetch: `curl -A facebookexternalhit
  https://www.facebook.com/reel/<id>` → grep `og:image` → download the bytes to `assets/`. All 8
  came back `s1000x1200` (9:16). `cardHTML()` branches thumb by platform; FB uses `vid--facebook`.
- **Aspect ratios are platform-true**: `.vid--youtube .vid-thumb{16/9}`, `.vid--facebook{9/16}`.
  The modal reshapes: `open()` toggles `.vmodal-box.is-reel` for FB → `.vmodal-frame{aspect-ratio:9/16;
  height:min(74vh,720px);width:auto}` (a phone-shaped player), YouTube stays 16/9.
- **Play icon is hover-only** but only on hover-capable devices: `@media (hover:hover){.play{opacity:0}
  .vid:hover .play,.vid:focus-visible .play{opacity:1}}` — touch keeps it visible (no hover).
- Headless-tested with jsdom (stub matchMedia/IntersectionObserver/rAF, Proxy canvas ctx) driving
  tabs/dropdown/modal — the browser pane times out on this animated page, jsdom doesn't.

## Portrait — free local background removal (17 July 2026)

Both portrait slots are **transparent cutouts on their frame gradient** (background removed
free/locally). **Current state (26 Jul 2026):** hero `.portrait-photo` = Vishal + his golden
retriever, cutout on the amber frame (`hero-dog-cutout.webp`, 4:5, subjects bottom-anchored so
the arch top shows amber); about `.about-img` = the **former hero green-shirt cutout**
(`portrait-cutout.webp`), moved here on owner request. The old B&W about headshot
(`about-cutout.webp`) is now **unused**.
**Frame-colour gotcha:** the green-shirt cutout has a dark teal shirt + dark pants, so it
**vanished on the old dark-olive `.about-frame` gradient** — dark-on-dark. Fixed by switching
`.about-frame` to a warm `linear-gradient(165deg,#fbf3e2,#f2c877)` (cream→amber) so the dark
figure reads. If any future dark-clothed cutout goes in an olive slot, it needs a light backdrop.
**Earlier state (17 Jul):** hero = green-shirt `portrait-cutout.webp` on amber; about = high-key
B&W `about-cutout.webp` on olive (grayscale, head-to-chest 1:1), source
`Downloads/New folder/now_the_transparent…jpeg` (2752x1536).
The dog photo arrived chat-pasted; the file was `Downloads/WhatsApp Image 2026-07-26 at 10.18.27
PM.jpeg` (1310x1600). imgly cut man+dog cleanly (golden fur vs tan floor held up); faint backlit
halo at the head + a small marble wisp under the paws remain, acceptable.
**imgly Blob needs a MIME type** — `new Blob([bytes], {type:'image/jpeg'})`; a bare Blob throws
`Unsupported format:`. Scratchpad `bgrun.js` carries the working recipe.
Higgsfield was the ask but its **free plan = 0 credits** → all generation/bg-removal via Higgsfield
is blocked. Did it **free & local** instead with `@imgly/background-removal-node` (ONNX, no key, ~3s):

- Install is flaky — it landed in the **parent** `node_modules` (`C:/Users/Susanta Podder/node_modules`),
  and its `exports` block hides `package.json` so `require.resolve(...package.json)` throws.
- Working recipe (see scratchpad `bgrun.js`): delete any partial copy in the scratchpad
  `node_modules/@imgly` so require resolves the **complete parent** install; pass the source as a
  **Blob** (`new Blob([fs.readFileSync(src)])`), not a path (a path is parsed as a URL →
  "Unsupported protocol: c:"); and set `publicPath` to a **`file://` URL of the package's `dist/`**
  (hardcode the parent path). Output `{format:'image/png'}`, then crop/tint with `sharp` and export
  **WebP** (62KB vs 426KB PNG). Free tools cover bg-removal/crop/grayscale/colour; only *generating a
  brand-new scene from scratch* needs paid credits.
- **Getting the source photo:** same as the cover — chat-pasted images aren't on disk, but the owner's
  file usually is. `find ~/Downloads -mmin -720 -iname '*.jp*g'` + check dims; the hero photo was
  `Downloads/WhatsApp Image …1.58.06 PM.jpeg` (900x1600).

## Responsive — audit harness + a real collapse bug (17 July 2026)

**Screenshots are dead on the preview pane** (times out even with animation stripped), but **JS probes
work on a non-animated page.** Trick: copy `index.html` → `_rtest.html` with a `<script>` injected
right after `<body>` that stubs `window.matchMedia` to report `matches:/reduce/.test(q)` — app.js then
takes its reduced-motion path and never starts canvas/cursor/rAF, so `resize_window` + a
`getBoundingClientRect` / `scrollWidth>clientWidth` probe reads true layout at any width. **Delete
`_rtest.html` before every deploy** (it's in the folder → would ship).

**Bug fixed:** `.book-cover` and `.portrait` used `width:min(280px,100%)` while their only children are
absolutely-positioned → 0 max-content. On the mobile single-column grid the parent track is `auto`
(esp. with `justify-content:start`), so `100%` resolves circularly to **0 → the element was invisible
on tablets/phones** (rendered on desktop only because the 2-col grid gives a definite track). Fix:
viewport-based widths — `.book-cover{width:clamp(200px,54vw,280px)}` and `.portrait{width:min(360px,74vw)}`
in the ≤1000 block. Verified 320→1280 with no horizontal overflow.

**Android font-boosting overlap (fixed 26 Jul 2026, css v=18).** Owner's phone showed the hero
keyword row (`IMPORTER · EXPORTER · …`) crowding/overlapping the "Work With Me" button. **Could
NOT reproduce in any tool** — the in-app pane and desktop Chrome both measured a clean 34–38px
gap at every width (320–390) in every reveal state; real Chrome won't shrink below ~500px window
so it renders the desktop layout, not mobile. Root cause = **Chrome/WebKit mobile text-autosizing
("font boosting")**: on a real phone it inflated the 11.5px keyword caps ~1.4× past their line box
so they bled upward into the button. The CSS had **no `text-size-adjust`**. Fix: 
`html{…;-webkit-text-size-adjust:100%;-moz-text-size-adjust:100%;text-size-adjust:100%}`. 
Lesson: **font-boosting only manifests on real handsets** — if a mobile overlap can't be
reproduced in devtools/the pane but the owner has a phone screenshot where text looks oversized,
suspect this first; it's invisible to every desktop-based check here.

## Book cover — DONE (16 July 2026)

`assets/book-cover.jpg` (1054x1492), `<img class="book-img">` inside `.book-cover`; the
CSS-only fake cover (`.book-front`/`.book-kicker`/`.book-ttl`/`.book-foot`) is **deleted** —
don't reintroduce it. `.book-cover` uses `aspect-ratio:1054/1492` (the file's real ratio, not
the old `2/3`) so `object-fit:cover` crops nothing — the title sits near the top edge and
"VISHAL AGARWAL" near the bottom, so a 2/3 box would clip them.

**The cover art contains Bengali (প্রথম কনটেইনার) and that is fine** — the English-only rule
governs *site copy*, not a photograph of a real artifact, same principle as never rewriting a
real person's quote. `alt` text stays English. The Bengali regression grep only scans
`index.html contact.html app.js style.css`, so an image never trips it.

**Getting a chat-pasted image onto disk:** there's no tool to export it — but the owner
usually already has the file. Don't ask first; look:
`find ~/Desktop ~/Downloads ~/Pictures -maxdepth 3 -iname '*.jpg' -o -iname '*.png' -mtime -3`,
match on aspect ratio + recency, then `Read` the candidate to eyeball it against the pasted
image before using it. The cover was sitting in `Downloads/WhatsApp Image ….jpeg`.

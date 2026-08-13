---
name: kianben-web
description: >-
  Project context + working guide for the KiAnben website (kianben.com) — a
  Bangladeshi shared-import community site: an HTML/CSS/JS frontend served by an
  Express server, data in Neon Postgres (prod) / a JSON file (local dev),
  deployed on Vercel serverless. Load this whenever the user works on KiAnben,
  kianben.com, "the import site", the book shop / book orders, bKash/Nagad
  payments, the member sign-in / admin panel, or anything in the
  Desktop/claude/kianben.web folder — it carries the architecture, file map,
  deploy/env setup, data model, conventions, and open TODOs so a fresh
  conversation can continue without re-deriving everything. Use it even for
  vague asks like "fix the site", "the orders aren't showing", "change the book
  price", "it looks broken on my phone", "the animations load late", or "deploy
  my changes" — it also carries the responsive/nav/scroll-reveal and gold-vs-cyan
  rules that must not be regressed. For the generic Vercel-serverless mechanics
  it relies on, see the companion skill `vercel-node-serverless`; for the
  measure-don't-eyeball layout audit method, see `responsive-reveal-audit`.
---

# KiAnben website — project context & working guide

KiAnben is a Bangladesh shared-import community site + a small e-commerce/admin
app. This skill is the durable memory of how it's built so work can continue in a
new conversation. For the *why* behind the Vercel serverless patterns below, read
the companion skill **`vercel-node-serverless`** (same author, extracted from this
same project).

## Identity & locations

| Thing | Value |
|---|---|
| Local path | `C:\Users\Susanta Podder\Desktop\claude\kianben.web` |
| Live site | https://kianben.com (apex live; **`www` not configured**) |
| Vercel alias | `kianbenweb.vercel.app` |
| Vercel team / project | scope `susanta-podders-projects` / project `kianben.web` |
| GitHub | `https://github.com/hellokianben-collab/kianben.web.git` — **no push access from this account**, so deploys are CLI uploads, not git-push |
| Local dev | `npm run dev` (nodemon) on port 3000; preview via `.claude/launch.json` server name `kianben-dev` |

## Stack & architecture

- **Frontend:** single `index.html` (~1000 lines) + `styles.css` + `main.js`, dark
  "Deep Harbor" glass theme, no framework, Google Fonts only. Admin is a separate
  SPA: `admin.html` + `admin.css` + `admin-panel.js`.
- **Backend:** Express `server.js` exports the app (guarded `app.listen` for
  local only); routes under `route-*.js`. `vercel.json` bundles it as one
  `@vercel/node` function with `includeFiles` for static assets + `kianben.json`.
- **Data — dual-mode, the important part:** two store adapters expose the same
  method names, backed by **Neon Postgres when `DATABASE_URL` is set** (prod) and
  the local **`kianben.json`** file otherwise:
  - `store-app.js` → members, applications, announcements, admins, import orders,
    pricing. (Wraps `db-init.js` in JSON mode.)
  - `store-book.js` → book orders + book config.
  - `db-init.js` is the JSON-file layer + first-run seeds (admin user, sample
    announcements, pricing, book config).
  Routes `await` these. **Never reintroduce direct `fs` JSON writes in request
  handlers** — they vanish on Vercel's ephemeral filesystem (that was the sign-in
  bug we fixed).

## File map

| File | Role |
|---|---|
| `server.js` | Express app, static whitelist + `sendStatic` cache headers, route mounts, `VERCEL` guard |
| `route-auth.js` | member login, admin-login, JWT verify, profile update |
| `route-members.js` | public membership `apply` |
| `route-announcements.js` | public board `published` / `request` / `quote` (emails) |
| `route-admin.js` | admin CRUD (verifyAdmin JWT): apps, members, import orders, announcements, pricing; `genPassword` (crypto-random) |
| `route-book-orders.js` | public book `config` + `POST` order; admin list/status/delete/config |
| `store-app.js` / `store-book.js` | dual-mode JSON⇄Postgres adapters |
| `db-init.js` | JSON data layer + seeds |
| `payments.js` | gateway interface stub (manual now; bKash-PGW/Nagad-API later) |
| `mailer.js` | nodemailer Gmail; `send`/`notifyAdmin`/`sendWelcomeEmail`/`sendApplicationNotification`; stubs to console if `EMAIL_PASS` unset |
| `auth-middleware.js` | `verifyToken` (member) / `verifyAdmin` |
| `index.html`/`styles.css`/`main.js` | public site (single-page scroll; book section removed — see below). `main.js` also holds `revealEngine()` and the fluid `--t-*`/`--pad-*` tokens live in `styles.css` `:root` |
| `book.html`/`book.js` | **standalone book page** at `/book` — selling + free preview reader; own slim nav back to `index.html#…`; loads its own `book.js` (NOT main.js) reusing the same `/api/book-orders/*` contract |
| `board.html`/`board.js` | **standalone board page** at `/board` — full community feed + submit-a-notice modal; own slim nav; loads its own `board.js` (NOT main.js) reusing `/api/announcements/*`. Homepage keeps a 3-item teaser (`#announcementFeed[data-limit="3"]`) + "See the full board" link |
| `admin.html`/`admin.css`/`admin-panel.js` | admin SPA |
| `vercel.json` | serverless config (includeFiles) |
| `nodemon.json` | ignores `kianben.json` so local writes don't restart-loop |

## Neon Postgres data model (production)

- `app_records (collection TEXT, id INT, data JSONB, PK(collection,id))` — one
  generic table for members / applications / announcements / admins / orders.
- `app_counters (collection TEXT PK, n INT)` — per-collection auto-increment.
- `app_kv (k TEXT PK, v JSONB)` — holds `pricing`.
- `book_orders (…columns…)` — typed table for book orders.
- `book_config (id=1, config JSONB)` — editable book/payment settings.

Filtering is done in JS (small datasets). Connect for one-off admin/SQL with the
`DATABASE_URL` from Vercel env (`vercel env pull` or the value on file) + `pg`.

## Features built (this project's history)

1. **Book shop — now a standalone page `book.html` at `/book`** (moved out of
   `index.html`; top-nav "Book" + footer "The book" link there). Animated 3D
   CSS/SVG book, config-driven price/title, order modal with bKash/Nagad picker,
   delivery zone (Dhaka/outside), live total, TrxID field — plus a **preview
   reader** ("read a few pages"): paginated free-preview section with prev/next +
   dot nav + keyboard arrows, ending on a locked "order your copy" CTA page.
   Preview pages are built-in in `book.js` (`DEFAULT_PREVIEW`) but override if
   `book_config.preview` is a non-empty array. Logic lives in **`book.js`**
   (`initBookShop`/`initOrderCalc`/`initOrderForm`/`renderPreview`) — a
   self-contained copy of the book logic so the page doesn't pull in the whole
   `main.js`. Server: `book.html`+`book.js` added to `server.js` `FRONT_END`,
   `vercel.json` `includeFiles`, plus a clean `app.get('/book')` route; sitemap
   has `/book`. Reader/CTA CSS appended to `styles.css` (`.reader*`,
   `.book-cta-row`, `.book-page-hero`, `.footer-mini`; `.reader` added to the
   `.glass` selector list). Local preview via `.claude/launch.json` `kianben-dev`.
1b. **Board — standalone page `board.html` at `/board`** (moved out of `index.html`;
   top-nav "Board" + footer "Cargo board" link there). Full community feed +
   submit-a-notice modal, logic in **`board.js`** (self-contained copy:
   `loadAnnouncements`/`annCard`/`initAnnouncementForm`, same `/api/announcements/*`).
   Homepage keeps a **teaser**: `#announcementFeed[data-limit="3"]` (main.js
   `loadAnnouncements` slices to `data-limit`) + a `.board-more` "See the full
   board" button; the home aside + announcement modal were removed (submit now
   lives on the board page). Server/vercel/sitemap updated the same way as book;
   clean `app.get('/board')` route. **Kept inline by design:** Services (core pitch)
   and Sign-in (modal is the right auth pattern) — only Book + Board got own pages.
2. **Book orders backend** — manual bKash/Nagad **TrxID** flow: server-side price
   calc, duplicate-TrxID guard, awaited emails, status
   `pending→verified→shipped→delivered→rejected`. See `vercel-node-serverless`
   skill's `references/payments-bd.md` for the pattern + phase-2 API seam.
3. **Admin "Book Orders" tab** — `admin.html` + `admin-panel.js`: order list with
   TrxID copy, status buttons, and an owner **settings editor** (price, delivery
   charges, bKash/Nagad numbers, availability).
4. **Premium motion redesign** — hero floating cargo containers, animated service
   scene SVGs (pooling boxes / ship / radar), crawling step rail; all respect
   `prefers-reduced-motion`.
5. **Sign-in → Postgres migration** — the big fix: members/admins/etc. moved off
   the ephemeral JSON file so logins persist in production. Stronger temp
   passwords (crypto-random) and awaited welcome email (carries the password).
6. **Responsive + motion pass (2026-08-12)** — three real defects, all measured
   rather than eyeballed: the burger sat **off-screen** on every phone under
   ~470px (menu unreachable); a scrollbar drag to the footer left **all 23
   `.reveal` blocks at `opacity:0` permanently** (page read blank on the way back
   up); the cost table overflowed 101px and was clipped by the card. Fixed with a
   drop-down CTA, a new `revealEngine()`, a scrollable table, a fluid `--t-*`
   type ramp, and a gold/cyan colour split. Deployed `v=6`. **Full rules in the
   section near the end of this file — read it before touching nav, `.reveal`,
   or the palette.**

## Env vars (in Vercel production — names only; values in `.env` / Vercel)

`DATABASE_URL` (Neon), `EMAIL_USER` (the owner's Gmail — value redacted for the public repo,
see the private note), `EMAIL_PASS`
(Gmail **App Password**), `SITE_URL` (https://kianben.com), plus `JWT_SECRET`,
`ADMIN_JWT_SECRET`, `ADMIN_PASSWORD`, `WHATSAPP_NUMBER` used by the app. Secrets
live in local `.env` and Vercel's encrypted env — **never print or commit them**;
add via `printf '%s' "$V" | vercel env add NAME production --scope susanta-podders-projects`,
then redeploy.

## How to work on it

- **Deploy:** `vercel deploy --prod -y --no-wait --scope susanta-podders-projects`
  then `vercel inspect <url> --scope … | grep -i status` until `● Ready`.
- **Admin login:** `/admin.html`, username `admin`, password = `ADMIN_PASSWORD`
  from `.env`.
- **Verify backend flows with curl, not screenshots.** Screenshots time out on
  these pages — the canvas layers keep the compositor busy. Drive flows against
  prod: apply → approve → login → verify → profile; assert the JSON.
- **Verify layout with `getBoundingClientRect`, not screenshots either.** Those
  measurements work in the preview pane even when it can't paint, and they catch
  breakage the eye misses because `body { overflow-x: hidden }` silently *clips*
  overflow instead of showing a scrollbar. See the `responsive-reveal-audit`
  skill for the probe scripts and the full method — that skill is where the
  generic technique lives; this section only records the KiAnben outcome.
- **Prove writes persist across requests** (login_count incrementing) — the
  serverless-specific check.
- Match existing conventions: icon sprite `<use href="#i-name"/>`; `.glass`
  primitive is a hardcoded selector list (append new card classes); `.reveal`
  scroll-in driven by `revealEngine()`; fluid sizing via the `--t-*` /
  `--pad-*` tokens; forms use `Object.fromEntries(new FormData())` + a `post()`
  helper + `#…Error`/`.success-box`; admin fetch via `af()` with bearer token;
  admin tabs wired in four places (sidebar button, `#tab-…` div, titles map,
  `switchTab` load).

## Responsive + motion pass (2026-08-12) — do not regress

Three defects were fixed and verified at 320/360/390/768/1440 on all four pages.
The rules below are load-bearing:

- **Cache-bust every asset link.** `sendStatic` serves css/js with
  `max-age=3600` while HTML is `no-cache`, so a deploy can hand a returning
  visitor new HTML with hour-old CSS. All four pages link `?v=N` — **bump N in
  index/book/board/admin.html on every css/js deploy** (currently `v=6`).
- **The nav CTA lives in two places.** Below 880px `.nav-actions > .btn` is
  `display:none` and a duplicate renders inside `.nav-links` as
  `<li class="nav-cta">`. Without this the burger is pushed off-screen on every
  phone under ~470px and the menu becomes unreachable. Keep the duplicate on the
  **class** hook (`.js-open-quote` / `.js-open-order` / `.js-open-announce`) —
  never an id, they must not collide. Sign-in label is wrapped in
  `<span class="btn-signin-txt">` so it can go icon-only under 460px;
  `setNavState()` in main.js re-emits that span, keep it.
- **`revealEngine(list)` replaces the old IntersectionObserver.** Duplicated
  verbatim in main.js / book.js / board.js — **patch all three together.** A bare
  IO only fires on a viewport *crossing*, so dragging the scrollbar to the footer
  left all 23 blocks at `opacity:0` permanently and the page read blank on the
  way back up. The rect sweep is the fix; it must not be removed. It falls back
  from rAF to a timer while `document.hidden`.
- **`.reveal.reveal`, not `.reveal`.** Component rules like `.about-points li`
  are 0-1-1 and out-specify a single class. The doubled class is deliberate.
- **Colour rule: cyan = system, gold = value.** Cyan for status/structure/nav;
  gold (`--grad-gold`, `--gold*`) for money, CTAs, proof. `.btn-primary` /
  `.btn-amber` are gold; `.btn-cyan` exists if a cyan primary is ever needed.
  `--signal` is now an alias of `--gold` for its 30+ legacy call sites.
- **Type is fluid via the `--t-*` ramp + `--pad-sec`/`--pad-card`** in `:root`.
  Prefer those tokens over bare rem so new work stays responsive by default.
- Buttons wrap only at spaces (`word-break: keep-all`, no hyphens) — never
  mid-word. Particles are off under 760px and aurora parallax under 900px
  (two fullscreen canvas loops sank mid-range Android).

**Verifying:** the Browser pane stalls `requestAnimationFrame` and
IntersectionObserver whenever it isn't displayed, so reveal logic looks broken
when it is fine — shim rAF to a timer inside `javascript_tool` and dispatch
`scroll` by hand. `getBoundingClientRect` overflow audits work regardless and
are the reliable way to check responsive breakage.

## Open TODOs / cautions

- **Rotate the Neon DB password** — the connection string was pasted in chat.
  Reset in Neon, then update `DATABASE_URL` in Vercel + redeploy.
- **Set real book details** — admin → Book Orders → settings: title (placeholder
  "The Import Playbook"), real price (placeholder ৳500), and confirm the
  bKash/Nagad numbers (placeholder `01683000984` for both).
- **`www.kianben.com`** isn't configured — only apex resolves. Add www→apex.
- **Phase-2 payments** — swap `payments.js` `manual` gateway for official bKash
  PGW / Nagad merchant API once a merchant account is approved; flip
  `book_config.gateway`.
- Rotate `ADMIN_PASSWORD` / email App Password if they were ever exposed.
- **`.reveal` eats component hover transitions.** `.reveal.reveal` sets the
  `transition` shorthand, which replaces (not merges with) the `transition` on
  `.svc` / `.step` / `.why`, so their border/box-shadow hover easing is gone on
  revealed cards. Pre-existing, not a regression from the 2026-08-12 pass — but
  if hover polish is wanted back, split reveal onto
  `transition-property`/`-duration` and re-add the component list.
- **`www.kianben.com`** still unconfigured (also listed above) — worth doing
  before any ad spend, since people type `www.`.

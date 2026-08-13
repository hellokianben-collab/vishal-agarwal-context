---
name: vercel-node-serverless
description: >-
  Deploy an existing file-based Node/Express app (HTML/CSS/JS frontend served by
  an Express server, data in a JSON file) to Vercel serverless — and fix the
  gotchas that silently break it there. Use this whenever someone wants to put a
  Node/Express, HTML+API, or "server.js" style site live on Vercel, connect a
  custom domain, or is confused why a site that "works locally" is broken in
  production: unstyled pages / 404 assets, data that disappears after a while
  (logins fail, orders vanish, admin edits reset), or emails that never arrive.
  Also use when adding persistent storage (Postgres/Neon) to a JSON-file app, or
  a manual bKash/Nagad (Bangladesh mobile-money) payment + order flow. Trigger
  even if the user only says "deploy my site to Vercel", "my Vercel site looks
  broken", "make logins persist", or "sign-in stopped working in production" —
  the serverless traps below apply to almost every file-based Node app.
---

# Shipping a file-based Node/Express app to Vercel serverless

Vercel does **not** run your `node server.js` as a long-lived process. It bundles
your app into a **serverless function** that spins up per request, runs on a
**read-only, ephemeral filesystem**, and is **frozen the moment you send the HTTP
response**. Almost everything that "works on localhost but breaks on Vercel"
traces back to one of those three facts. This skill is the checklist of what
breaks and how to fix it, learned the hard way.

Work top to bottom the first time. On a repeat visit, jump to the symptom.

## 0. The mental model (read this first)

| Local (`node server.js`) | Vercel serverless |
|---|---|
| One process stays alive | Function starts per request, dies after |
| Disk is writable + persistent | Disk is **read-only except `/tmp`**, wiped on cold start |
| `app.listen()` holds the port | The **exported `app`** is invoked; `listen()` is meaningless |
| Work after `res.send()` still runs | Function is **frozen after the response** — trailing async is dropped |
| Files next to `server.js` are readable | Only files **explicitly bundled** are present |

Keep this table in mind; each fix below is just honoring one row.

## 1. Make Express run as a function

Vercel's `@vercel/node` invokes the module's **exported Express app** as the
handler. Two things must be true:

1. `server.js` ends with `module.exports = app;`
2. `app.listen()` is guarded so it only runs locally — on Vercel it's dead weight
   and can error:

```js
// On Vercel the exported app is used directly — never listen().
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
}
module.exports = app;
```

Add a `vercel.json` that routes everything through `server.js`. See
`references/vercel-config.md` for the full file — including the critical
`includeFiles` line covered next.

## 2. The static-asset trap (unstyled page / 404 CSS+JS)

**Symptom:** the deployed page loads as raw HTML — no styling, broken images,
dead buttons. `curl https://site/styles.css` returns 404 or the SPA's
`index.html`.

**Cause:** `@vercel/node` bundles `server.js` and its `require()` graph, but
**not** static assets your code reads at request time with
`res.sendFile(__dirname + '/styles.css')`. They aren't in the bundle, so
`sendFile` fails.

**Fix:** list every served static file (and the JSON data file, see §3) under
`build.config.includeFiles` in `vercel.json`. This keeps the server's existing
whitelist logic intact (backend `.js` stays unexposed) while shipping the assets:

```json
{
  "version": 2,
  "builds": [{
    "src": "server.js",
    "use": "@vercel/node",
    "config": { "includeFiles": ["index.html","styles.css","main.js","logo.png","kianben.json"] }
  }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

**Verify with the real thing, not a screenshot:**
```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" https://site/styles.css
```
Expect `200 text/css`. Browsers also aggressively cache a blank first load — see
§5 and always hard-reload (Ctrl/Cmd+Shift+R) when checking.

## 3. The vanishing-data trap (logins fail, orders/edits disappear)

**Symptom:** things work for a few minutes then reset. A member is approved,
signs in fine, then an hour later "invalid email or password." Orders, admin
edits, new posts silently disappear.

**Cause:** the app stores data in a **JSON file** and writes it with
`fs.writeFileSync`. On serverless that write hits a read-only/ephemeral disk and
is gone on the next cold start. This is the single most common "it worked
locally" production failure.

**Fix — the dual-mode store adapter.** Don't rewrite every route against a raw
DB. Introduce one adapter module that exposes the *same function names* the code
already calls, backed by **Postgres when `DATABASE_URL` is set** (production) and
the **existing JSON file otherwise** (local dev). Routes just `await` the same
calls. `scripts/store-adapter-template.js` is a ready template — copy it, keep
the method names your routes already use, deploy behind `DATABASE_URL`.

Migration steps:
1. Copy `scripts/store-adapter-template.js` → e.g. `store.js`; adjust the method
   list and any seed data to match your existing JSON layer.
2. In each route file, change `require('./db-init')` → `require('./store')` and
   make the DB calls `await` (the handlers are already `async`).
3. Free managed Postgres: **Neon** (neon.tech) or Vercel → Storage → Postgres.
   Copy the connection string.
4. Add it to Vercel **without printing the secret**, then redeploy:
   ```bash
   printf '%s' "$CONN_STRING" | vercel env add DATABASE_URL production --scope <team>
   vercel deploy --prod -y --no-wait --scope <team>
   ```
5. Add `"pg": "^8.13.1"` to `package.json` dependencies.

The template stores each collection as JSONB rows so one set of CRUD code serves
members, orders, etc. — filtering happens in JS (these datasets are hundreds of
rows, not millions). Ship the JSON file in `includeFiles` too so it's a harmless
read-only fallback if `DATABASE_URL` is ever unset.

**Prove persistence survives a cold start** — this is the whole point:
```bash
# log in twice; login_count must increment across requests
curl -s .../api/auth/login -d '{...}'   # login_count: 1
curl -s .../api/auth/login -d '{...}'   # login_count: 2  ← persisted in Postgres
```

## 4. The dropped-email trap (notifications never arrive)

**Symptom:** order/signup confirmation emails send locally but never in
production, with no error.

**Cause:** fire-and-forget after the response —
```js
mailer.send({...}).catch(logIt);   // ← started but not awaited
res.status(201).json({...});        // ← function frozen; SMTP handshake never finishes
```
On serverless the container can be frozen the instant the response is sent, so
the ~1–2s Gmail/SMTP round-trip never completes.

**Fix:** `await` the sends *before* responding. The record is already saved, so a
mail failure should be non-fatal but the send must be given time to run:
```js
await Promise.allSettled([adminMail, customerMail]);
res.status(201).json({ ... });
```
This is doubly important for any email that carries a one-time secret (e.g. a new
member's generated password) — silently losing it strands the user.

Two more production email facts:
- Email is a no-op until creds exist in prod. A common mailer stubs to
  `console.log` when `EMAIL_PASS` is unset. Add `EMAIL_USER` + `EMAIL_PASS`
  (Gmail **App Password**, not the account password) to Vercel prod env, plus
  `SITE_URL=https://yourdomain` for correct links in email bodies.
- Confirm by tailing runtime logs while triggering: `vercel logs <deployment-url>`
  streams **forward** — start it, then fire the request; past invocations don't
  replay.

## 5. Cache headers (deploys don't show up / needless function cost)

Serving every asset with `Cache-Control: no-cache` makes the CDN skip caching, so
every image hit is a billed function invocation. Serving with a long
immutable cache makes HTML deploys not show up. Split them:
```js
res.set('Cache-Control', file.endsWith('.html')
  ? 'no-cache'                                   // HTML revalidates → deploys appear instantly
  : 'public, max-age=3600, s-maxage=31536000');  // css/js/img cached at CDN; new deploy busts it
```

## 6. Deploy + custom domain (the CLI flow that works)

```bash
vercel whoami                                   # confirm auth
vercel deploy --prod -y --no-wait --scope <team>   # returns URL immediately
vercel inspect <deployment-url> --scope <team> | grep -i status   # wait for "● Ready"
```
- First deploy auto-creates the project (name derived from the folder). GitHub
  auto-connect fails without write access to the repo — that's fine, CLI upload
  still deploys.
- Custom domain: the user adds it in Vercel (Domains) and points DNS; apex often
  resolves to a Vercel anycast IP. Verify apex **and** `www` — `www` frequently
  isn't configured (`curl` it; a `000`/no-resolve means it's missing).

## Verification workflow (always do this, never hand-wave)

The browser preview's screenshot tool can hang on heavy CSS/canvas pages. Prefer
`curl` and DOM/JS probes; use screenshots only for a final visual once the DOM
checks pass.

1. `curl` the deployed URL + a CSS/JS asset → expect `200` and correct
   content-type (§2).
2. Exercise the real flow end-to-end against production with `curl`
   (apply → approve → login → verify → update), asserting the JSON responses.
3. Prove a write **persists across requests** (§3) — the serverless-specific check.
4. Confirm secrets are never printed; feed them via `printf ... | vercel env add`.
5. Clean up any test rows you created (delete via the admin API or straight SQL).

## Bundled references

- `references/vercel-config.md` — full `vercel.json`, the `app.listen` guard, and
  cache-header snippet, ready to copy.
- `references/payments-bd.md` — manual bKash/Nagad (Bangladesh mobile-money)
  order + payment flow: customer sends money to a personal number and submits the
  TrxID; owner verifies by hand in the admin panel. Server-side price calc,
  duplicate-TrxID guard, and a clean seam to drop in official bKash PGW / Nagad
  merchant APIs later. Read it when the task involves taking payments or a
  book/product shop for a BD audience.
- `scripts/store-adapter-template.js` — the dual-mode JSON⇄Postgres store; copy
  and adapt its method list to your app.
```

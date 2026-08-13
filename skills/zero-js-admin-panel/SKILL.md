---
name: zero-js-admin-panel
description: >-
  Build an owner-facing dashboard or admin panel that works with JavaScript fully disabled —
  server-rendered HTML, real forms, plain links. Use when a login or button "does nothing and shows
  no error", when an admin panel works in curl but not in the owner's browser, when the user is on a
  browser with extensions/script blockers, or when building any internal panel where reliability
  beats interactivity. Also use before writing a client-rendered admin, as the default choice.
  Carries the diagnostic that identifies a script blocker, the patterns for actions without JS, and
  the escaping rule that replaces `textContent`.
---

# Zero-JavaScript admin panels

This skill exists because **four builds** were needed to make one login work, and the winning build
was the one with no client JavaScript at all.

---

## The diagnostic that matters

> *"clicking Unlock does nothing, and no error either."*

**That is the signature of the page's JavaScript never executing** — an extension, a script blocker,
a corrupted cache — **not of a wrong password.**

Three successive client-side builds treated it as a client bug and hardened the client:

1. **v1** — localStorage + `x-admin-key` header → nothing happens.
2. **v2** — hardened: one-click `?key=` link with `history.replaceState` scrubbing, paste
   sanitization against 7 corruption cases, show/hide + character counter,
   `autocomplete="off"` / `data-1p-ignore` against password managers, friendly errors for
   401/503/network → still nothing.
3. **v3** — auth moved server-side (form POST + HttpOnly cookie) but `admin.js` kept for rendering →
   still nothing.
4. **v4** — **deleted `admin.js` entirely, server-rendered everything.** Works.

**Rule: when a login silently does nothing, stop hardening the client. Render it on the server.**

Confirm before rebuilding, with three commands:

```bash
curl -H "x-admin-key: $K" $B/api/order-stats          # expect 200  → auth + DB are fine
curl -X POST $B/api/admin-login -d "key=$K" -i        # expect 302 + Set-Cookie
curl -s $B/admin | grep -c '<script'                  # expect 0
```

If those pass, **the bug is in the browser, not the code.**

---

## The architecture

```
/admin  ──(rewrite)──▶  api/admin-page.js  ─┐
                                            ├─▶ lib/admin-handler.js
/api/admin-view?key=… ▶ api/admin-view.js  ─┘        ├─▶ lib/admin-data.js    (all the SQL)
                                                     └─▶ lib/admin-render.js  (all the HTML)
```

- One data module, one render module, two thin entry points. Both views render identically.
- **No `admin.html`, no `admin.js`.** If a static `admin.html` exists, Vercel resolves `/admin` to
  the file *before* rewrites and your function never runs. The file must be deleted, not just
  unlinked from nav.

## Every action without JavaScript

| Action | Mechanism |
|---|---|
| Sign in | real `<form method="POST" action="/api/admin-login">` |
| Sign out | link to `/api/admin-login?logout=1` |
| Export CSV | link to `?format=csv` |
| Re-check one row | link to `?recheck=<id>` |
| Expand a row editor | `<details>` — opens natively, no script |
| Multiple actions in one editor | one `<form>`, several `<button name="action" value="…">` |
| Feedback after an action | server re-renders with a **notice bar** |

**A click must never be answered with silence.** After every POST, re-render with a notice that says
what happened — including when a save succeeded but the email failed. Those are different outcomes
and the owner needs to know which one he got.

## Auth: HMAC cookie, no localStorage

- The gate is a real form POST. The endpoint validates the key and sets an
  **HttpOnly / Secure / SameSite=Lax** cookie holding `"<expiryMs>.<hmac>"` — an HMAC of the expiry,
  keyed by the admin key. **The key itself is never in the cookie.**
- `checkAdmin(req)` accepts, in order: **cookie → `x-admin-key` header → `?key=`**.
- Comparisons **sha256 both sides before `timingSafeEqual`**, so a length mismatch never throws and
  never leaks length.
- **Rotating the admin key invalidates every existing session for free.**
- Also support `GET /api/admin-login?key=…` as a magic link — no JS needed — and `?logout=1`.
- A wrong key with no JS returns a **server-rendered error page**. Never a blank screen.

## The `?key=` in-URL route

Keep a second route where the key rides in the query string, for locked-down browsers and in-app
webviews. It must send:

```
Cache-Control: no-store
X-Robots-Tag: noindex, nofollow
Referrer-Policy: no-referrer      ← so the key cannot leak via Referer
```

## Escaping — the rule that replaces `textContent`

Client-rendered admins are told "always `textContent`, never `innerHTML`". Server-rendered ones need
the equivalent:

> **Never interpolate a user-supplied value into admin HTML without `esc()`.**

One `esc()` in the render module, applied to every buyer-supplied field. The admin page is exactly
where stored XSS lands, because it is the one page that displays raw customer input to a privileged
user.

## PII is the point — protect it accordingly

Admin views return customer addresses and phone numbers **by design**; the owner ships from them.
That is precisely why they need: the admin key, `no-store`, `noindex` (header *and* meta tag), and
no third-party scripts.

## Progressive enhancement, if you must

Charts, live search and copy buttons all died with `admin.js` and were not missed. If one comes back,
it comes back as **enhancement that the page works fine without** — never as the mechanism.

Where a chart is genuinely wanted, a **table with CSS proportional bars** needs no script and no
colour-contrast validation.

## Checklist before shipping

- [ ] `curl -s $B/admin | grep -c '<script'` → **0**
- [ ] Every action is a link or a form
- [ ] Every POST re-renders with a notice
- [ ] `esc()` on every user-supplied value
- [ ] No same-named static file shadowing the route
- [ ] `no-store` + `noindex` on every admin response
- [ ] Wrong key → visible error page, never silence
- [ ] Key rotation invalidates sessions

## Related

- `owner-admin-security` — device binding, master key, failover hierarchy
- `vercel-hobby-limits` — filesystem-before-rewrites, and the function budget

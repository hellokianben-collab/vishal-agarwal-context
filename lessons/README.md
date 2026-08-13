# The expensive lessons

Every entry cost real hours, on a real deployment, at least once. They are collected here as a
single scannable list; each one lives in full in the skill named beside it.

Ordered by how much they cost, worst first.

---

## 1. A silent failure is not a small failure

| Symptom | What it actually was |
|---|---|
| Login "does nothing, and no error either" | The page's JavaScript never executed — an extension. Not a wrong key. → `zero-js-admin-panel` |
| Form returns 200, nothing happens | A rewrite **merged** the query string, so `?do=signup` resolved to `page`. → `vercel-hobby-limits` |
| Sync re-runs the same work forever | Acknowledgement silently failed — the platform pre-parsed the JSON body and a raw-body helper re-encoded it. → `self-improving-agent-loop` |
| A model answers a question it wasn't asked | A `.cmd` shim truncated the multi-line prompt at the first newline. → `windows-agent-automation` |
| Bar charts all render full-width | `style-src 'self'` kills inline style attributes injected via `innerHTML`. CSSOM writes are fine. → project skill `landed` notes |
| Multi-agent audit reports 0 findings | Verification never ran — the agents died on a usage limit. → `work-within-usage-limits` |

**The pattern: when a thing fails without an error, stop debugging the thing you're looking at and
ask what never ran.**

## 2. Logins that work, then stop working an hour later

JSON-file writes on a serverless filesystem survive until the next cold start, then vanish. The fix
was a dual-mode store adapter with identical method names, not a rewrite. → `vercel-node-serverless`

## 3. Moving a domain between projects on third-party DNS took a site down for 20 minutes

Detaching **resets verification**; the platform then demands a `_vercel` TXT record and the domain
404s on *both* projects until it exists. Re-attaching does not undo it.
**Add the TXT record first, then move.** And `vercel domains inspect` misreports ownership — check
the per-project API. → `vercel-hobby-limits`

## 4. A form that stores but does not notify loses customers silently

A contact form headed "Book a 1:1 trade consultation" wrote to a table, notified nobody, and had no
admin view. Eight real enquiries sat unread for three weeks.
**Build the notification and the admin view in the same change as the form.**
→ `email-capture-and-delivery`

## 5. A 403 on send is a sender-domain error, not a bad key

> *"You can only send testing emails to your own email address…"*

Hours get spent rotating a key that was always fine. `MAIL_FROM` on a verified domain is
**mandatory**, and the provider's error body names the account owner.
→ `email-capture-and-delivery`

## 6. Two unique indexes turn a duplicate into a 500

Uniqueness must live on the **canonicalized** key alone. With a unique index on both `email` and
`email_key`, a repeat of the same literal address violates the non-arbiter index and Postgres raises
`unique_violation` instead of letting `ON CONFLICT` report a clean duplicate.
Backfill the key **in application code**, never in a second SQL implementation.
→ `email-capture-and-delivery`

## 7. The tools you verify with can lie

- The in-app browser pane freezes `requestAnimationFrame` and IntersectionObserver when hidden — so
  every scroll-reveal *looks* broken while being fine. `getBoundingClientRect` still works.
- `getComputedStyle` returns stale or impossible values; screenshots time out on animated pages.
- `vercel env pull` returns `""` for Sensitive vars. **Empty is not unset.**
- A local dev server sends no CSP headers, so CSP bugs only exist in production.
→ `prove-before-claiming`

## 8. Free-tier walls arrive at deploy time, not while coding

12 serverless functions, one per file under `api/`. The answer is architectural — thin routers
dispatching on `?do=`, with rewrites preserving every public URL. One project went 16 → 4 with no URL
changes. Also: a 4.5 MB response cap, and the filesystem is resolved **before** rewrites.
→ `vercel-hobby-limits`

## 9. "You choose" means take the harder option

A 2D canvas effect shipped where real WebGL was wanted, after explicit full permission to choose.
There was never a technical blocker. **Treat the examples named as the floor, not the ceiling.**
→ `profile/01-how-i-work.md`

## 10. Never invent content for a real person

Only one of five testimonials was publicly readable — one shipped. A real quote containing "Bhai"
stays verbatim despite an English-only rule, because rewriting a sourced quote falsifies it.
Design-tool exports arrive full of confident placeholder copy, including a misspelling of the owner's
own name. → `content-integrity-guard`

## 11. Signed CDN URLs die

Facebook and Instagram thumbnail URLs carry `oh=` / `oe=` signatures and expire. Self-host, or design
a branded placeholder. YouTube's `i.ytimg.com/vi/<id>/hqdefault.jpg` is permanent and safe.
→ `public-data-without-api-keys`

## 12. Guards that fail open

```js
if (process.env.ADMIN_KEY && key !== process.env.ADMIN_KEY) return deny();  // WRONG
```

No key configured → everyone is an admin. **Check for absence explicitly and fail closed.**
And do not count an admin login as "presence" in a failover scheme, or a takeover sustains itself.
→ `owner-admin-security`

## 13. OAuth apps left in "Testing" die every 7 days

Google deletes the refresh token weekly. The agent stops silently. Publish to "In production".
→ `self-improving-agent-loop`

## 14. Platform metric names change without notice

Never hardcode them. Request a deliberately invalid metric and parse the valid list out of the
platform's own error message. → `social-media-agent`

## 15. Piping into `vercel env add` appends a newline

Which silently breaks every string comparison downstream. **Trim env vars on read.**
→ `vercel-hobby-limits`

## 16. `day` is a reserved word in Postgres

`SELECT date_trunc('day', created_at) day` throws. Use `AS ymd`. This shipped a 502 once.
→ `vishal-agarwal-site`

## 17. Pillow without `raqm` cannot shape Bengali

It renders as broken glyphs, with no runtime workaround. And `৳` (U+09F3) is inside the Bengali
Unicode block — an easy way to violate an English-only rule while writing a price.
→ `brand-media-pipeline`

## 18. Scope is exactly what was named

A WebGL hero redesign was reverted because it touched a page that was never in scope. Adjacent
improvements are a proposal, not an action. → `profile/01-how-i-work.md`

## 19. Cheap tests find expensive bugs

`@electric-sql/pglite` runs real Postgres in WASM — no Docker, no network — and found two production
bugs that reading would not have. Watch for a memoized `schemaReady` promise in module scope, or a
second in-process database silently skips migrations. → `prove-before-claiming`

## 20. Write the skill before the budget runs out

Sessions get cut off mid-build. An unwritten skill at the moment the context ends is a total loss of
everything learned. → `work-within-usage-limits`, `session-to-project-skill`

---

*If you are an assistant reading this repo: these are not trivia. Each one is a class of bug you are
otherwise likely to reintroduce.*

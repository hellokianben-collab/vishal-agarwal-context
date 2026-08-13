# iamvishalagarwal.com — personal brand site + product platform

**Status:** live · **Started:** 15 Jul 2026 (third iteration) · **Stack:** plain HTML/CSS/JS +
4 Vercel serverless functions + Neon Postgres · **Deep skill:** `skills/vishal-agarwal-site`

The flagship. It started as a portfolio and became the platform that everything else mounts onto.

---

## What it does

| Route | What |
|---|---|
| `/` | Home — hero, marquee, services, four ventures, about, media, book, testimonials, CTA |
| `/contact` | Real 1:1 consultation booking (topic, date, time-of-day) with instant owner alert |
| `/order` | Book checkout — bKash PGW, city combobox, server-priced. Built, dormant until launch |
| `/read/<token>` | Ebook reader with per-device reader identity and reading analytics |
| `/admin` | Owner dashboard — **100% server-rendered, zero JavaScript** |
| `/landed` | The Bangladesh landed-cost calculator, mounted |
| `/community` | Member accounts + saved calculations |
| `/invoice` | Free invoice generator |
| `/garmentmind` | Landing page for the L/C checker |

## Why it is built the way it is

**Four serverless functions, not sixteen.** Vercel's Hobby plan caps a deployment at 12 functions
and builds one per file under `api/`. Rather than pay to escape it, real handlers moved to
`lib/routes/` and `api/` kept four thin routers dispatching on `?do=`, with `vercel.json` rewrites
preserving every public URL — so bookmarks, curl scripts and the bKash callback URL already
registered with the bank all kept working.

**The admin panel has no JavaScript at all.** Three successive client-side admin builds failed
silently in the owner's Chrome — clicking Unlock did nothing, and no error either. Server checks all
passed. That signature means *the page's JavaScript is never executing* (extension or cache), not a
wrong key. The fourth build deleted `admin.js` entirely and server-rendered everything: login is a
real `<form method="POST">`, CSV export is a link, reconcile is a link, the consultation editor is a
`<details>` block containing a form with five named submit buttons. It works. The security got
better too — HttpOnly HMAC cookie beats localStorage.

**Everything money-critical is verified server-side.** The order amount is computed on the server,
re-verified on execute, the callback is idempotent, and a callback error leaves the order
`initiated` rather than `failed` — because bKash may already have taken the money.

**Reading analytics are honest by construction.** `open` is recorded server-side so it counts even
with JS blocked. Heartbeats are visibility-gated and clamped to ≤120s so a forgotten background tab
can't inflate reading time. "Finished" requires **both** ≥90% of pages **and** ≥5 minutes — dragging
to the last page is not reading. And the dashboard prints the limitation it can't solve: a
downloaded PDF is invisible.

**Privacy is designed in.** Visitor tracking stores a *salted daily hash of IP+UA*, never a raw IP.
The reader gate identifies a person per device, not per human. Admin views return buyer PII by
design (he ships from them) — which is exactly why they sit behind an admin key, `no-store`, and
`noindex`, with `Referrer-Policy: no-referrer` on the key-in-URL route.

## The database

Neon Postgres, schema migrated idempotently in code: `waitlist`, `contacts`, `orders`, `visits`,
`consultations`, `ebook_grants`, `book_readers`, `book_events`, `book_progress`.

Two subtle bugs worth remembering, both found with **pglite** (real Postgres in WASM, no Docker):

1. Gmail `+tag` signups were being rejected by a validator that checked the raw local-part against
   `/^[a-z0-9.]+$/` — even though the file's own canonicalization logic existed specifically to
   accept and dedupe them.
2. Uniqueness must live on the **canonicalized** `email_key` alone. With a unique index on both
   `email` and `email_key`, repeating the same literal address violates the non-arbiter index and
   Postgres raises a 500 instead of letting `ON CONFLICT` report a duplicate.

## Real outcome worth naming

The `/contact` form was headed "Book a 1:1 trade consultation" but was a plain message box that
**notified nobody**, and no admin view showed the table it wrote to. When the consultation system was
built on 30 July, **8 unread enquiries were found sitting in it, the oldest from 22 July** — real
import/export leads. They now surface in the dashboard under "Older messages".

That is the clearest argument in this whole repo for wiring the notification before shipping the
form.

## Open

- bKash merchant + PGW production credentials (blocks live book sales)
- The book PDF file itself (blocks the ebook chain switching on)
- Four Facebook testimonials, Instagram + TikTok video links (see `profile/05-open-questions.md`)

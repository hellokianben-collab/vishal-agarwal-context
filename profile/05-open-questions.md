# Open questions — ask, never guess

Every item here is genuinely unresolved as of **13 August 2026**. They are collected in one place so
that no assistant fills one in with a plausible invention and ships it to a live page.

**Rule: if a task needs one of these, ask Vishal. Do not infer, do not average, do not "reasonably
assume".**

---

## Facts on the public site that don't reconcile

| # | Question | Why it's open |
|---|---|---|
| 1 | **Which fifth country?** | Copy says "5 COUNTRIES" but only four are ever named: Bangladesh, China, India, Vietnam. |
| 2 | **"4 VENTURES" or "4+ BUSINESSES"?** | Both phrasings appear. Pick one. |
| 3 | **Facebook follower count: 175K or 250K+?** | Both numbers have been used. Neither has been verified against the page. |

## Content that is missing, not written

| # | Item | State |
|---|---|---|
| 4 | **4 of 5 Facebook recommendations** | Only Saif Mahmud's (6 July) is publicly readable; the rest are behind a login wall. They must be **pasted by Vishal**, never reconstructed. |
| 5 | **Instagram + TikTok video links** | Both tabs on the site render an empty state. IG needs a login, TikTok serves a bot-check. Needs post URLs from him. |
| 6 | **The book PDF itself** | The entire ebook delivery + reading-analytics chain is built and verified, but has never rendered a real book because no file exists yet. Needs `BOOK_PDF_URL`. |

## Blocked on credentials only

| # | Item | Blocking on |
|---|---|---|
| 7 | **bKash live payments** | Vishal's own merchant + PGW API credentials. The public shared sandbox creds are dead. Code is complete and tested against mocks. |
| 8 | **GarmentMind real extraction** | The Claude extraction adapter is written but **has never been run once** with a real API key or a real document. Until it is, extraction is fixture data keyed off filenames. |
| 9 | **GarmentMind durable database** | On Vercel it is `/tmp` SQLite — resets on cold start, not shared across instances. Demo-only. Needs a real Postgres. |

## Product decisions he has not made

| # | Question |
|---|---|
| 10 | Does the **autonomous YouTube channel agent** (asked for 12 Aug 2026) get built, and under what account — a new channel, or the existing `@iamvishalagarwal`? |
| 11 | Should the **Resend account** be transferred into his own name? It is currently registered under a different address. |
| 12 | Is the **`landed` calculator** staying mounted at `iamvishalagarwal.com/landed` long-term, or moving to its own domain? (As of 31 Jul: "for now landed stays.") |
| 13 | GarmentMind pricing — nothing has been set, and no factory has been charged yet. |

## Things an assistant will be tempted to assume — and must not

- **Do not assume the Windows profile name is his name.** See `profile/00-who-i-am.md`.
- **Do not assume a GitHub account.** Two exist (`hellokianben-collab`, `calesthio`); only one is
  authenticated on the machine.
- **Do not assume any Vercel env var is unset because `vercel env pull` returned empty.** Sensitive
  vars always read back as `""`.
- **Do not assume a testimonial, a review, a metric, or a country.** See rule 9 in
  `profile/01-how-i-work.md`.

---

*When one of these gets answered, move it out of this file and into the fact where it belongs — and
delete the row. A stale open question is as harmful as a guess.*

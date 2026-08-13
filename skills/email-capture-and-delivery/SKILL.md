---
name: email-capture-and-delivery
description: >-
  Capture email addresses that are real, store them deduplicated, and actually deliver mail. Use when
  building a waitlist, signup, contact or booking form; when transactional email "isn't arriving";
  when signups produce duplicates or 500s; when a provider returns 403 on send; or when adding
  Resend/SES/Mailtrap to a project. Carries the verification ladder, Gmail dot/plus canonicalization
  and the unique-index rule it implies, the mandatory sender-domain configuration, the 403 diagnosis,
  and the behaviour contract that stops a form faking success.
---

# Email capture and delivery that works

Two independent problems that get conflated: **is this address real** and **did the mail arrive**.

---

## Part 1 — verification ladder, cheapest first

Run in this order, stop at the first failure, and always return **why**:

1. **Syntax** — real parsing, not a regex found on the internet.
2. **Disposable / throwaway domain blocklist.**
3. **Typo catch** — `gmial.com`, `gmail.co`, `yaho.com`. Suggest the fix rather than rejecting
   silently; a suggestion converts, a rejection bounces the user.
4. **Live DNS: MX, then A/AAAA fallback.** A domain with no mail route cannot receive mail. Cache
   results — do not query per keystroke.
5. **Provider-specific rules** (see Gmail below).

**Never do an SMTP-callback probe.** It is slow, unreliable, and gets you blocklisted.

## Part 2 — canonicalization, and the bug it caused

Gmail treats `first.last@gmail.com`, `firstlast@gmail.com` and `firstlast+anything@gmail.com` as the
**same mailbox**. So must you, or your "500 subscribers" is 300 people.

```
canonicalize(addr):
  lower-case
  if gmail/googlemail:  strip dots from local part
  strip +tag from local part  (all providers that support it)
  → email_key
```

**The real bug this caused:** a Gmail validator checked the **raw** local part — including the
`+tag` — against `/^[a-z0-9.]+$/`. `+` fails that class, so **every genuine Gmail `+tag` signup was
rejected** with "Gmail addresses only contain letters, numbers and dots" — in a file whose own
canonicalization logic existed specifically to accept and dedupe them.

**Fix:** strip the `+tag` *before* running the character-class check.
**Test:** insert `x@gmail.com`, then `x+anything@gmail.com` must return `duplicate:true`, **not** a 400.

## Part 3 — the unique-index rule (this one causes 500s)

> **Uniqueness lives on `email_key` alone. There must be NO `UNIQUE` on `email`.**

With a unique index on **both** `email` and `email_key`, repeating the same *literal* address
violates the non-arbiter index, and Postgres raises `unique_violation` — a **500** — instead of
letting `ON CONFLICT (email_key) DO NOTHING` report a clean duplicate.

Migration must therefore drop the legacy constraint:

```sql
ALTER TABLE waitlist DROP CONSTRAINT IF EXISTS waitlist_email_key;
```

### Backfill in application code, never in SQL

When adding `email_key` to an existing table:

1. Select the rows with a null key.
2. **Canonicalize them in JS/Python using the same function the app uses.**
3. Merge rows that turn out to share a key, keeping the earliest.
4. Only then build the unique index.

A second SQL implementation of the dot/plus rules **drifts silently** from the application one. And
the unique index cannot build while collisions exist — a failed index build wedges schema setup into
permanent 500s.

## Part 4 — delivery

### The sender domain is mandatory, not optional

Providers require `from` to be on a **verified domain**. Without an explicit sender:

```
403 "You can only send testing emails to your own email address (…).
     To send emails to other recipients, please verify a domain…"
```

**That 403 is a validation error, not a bad key.** It is the single most misdiagnosed email failure —
hours get spent rotating a key that was always fine.

Set both, always:

```
RESEND_API_KEY=…              ← the owner pastes this
MAIL_FROM="Name <hello@verified-domain.com>"   ← not a secret, safe to set via CLI
```

Falling back to the provider's shared sandbox sender **only delivers to the account owner** and 403s
for everyone else — so it works perfectly in your testing and fails for every real user.

### Diagnose from logs, not from guessing

```bash
vercel logs <deployment-url> --json | grep -i "email failed"
```

The provider's error body **names the account owner**, which is how you discover the account is
registered to someone other than the person who should hold it.

### Reply-To

Set `Reply-To` to the human's real inbox even when `From` is a branded domain address. Otherwise
replies go into a void nobody checks.

## Part 5 — the behaviour contract (never weaken these)

| Situation | Response |
|---|---|
| No database configured | **503** with a friendly message. Never a silent 200. |
| DB present, insert throws | **500 `{ok:false,error}`**. Never pretend it saved. |
| Duplicate canonical mailbox | **200 `{ok:true, stored:false, duplicate:true, message}`** — not an error, not a fresh insert |
| No mail provider configured | Signup still succeeds; greeting returns `{sent:false, reason:'not_configured'}`. **By design.** |
| Honeypot field filled | Silently accept, do not store |

**Client rule:** the form's `post()` throws unless `r.ok && body.ok === true`.
**A form must never fake success.** A green checkmark over a lost signup is worse than an error.

## Part 6 — wire the notification before you ship the form

The most expensive email lesson here had nothing to do with deliverability.

A contact form headed *"Book a 1:1 trade consultation"* wrote to a database table, **notified
nobody**, and had no admin view. When it was finally wired up, **8 real enquiries were sitting in it,
the oldest three weeks old.**

> **A form that stores but does not notify is a form that loses customers silently.**
> Build the notification and the admin view in the same change as the form. Not next sprint.

## Part 7 — testing without a database

`@electric-sql/pglite` runs real Postgres in WASM — no Docker, no network:

```js
const db = new PGlite();
const pool = { query: (sql, params) => params ? db.query(sql, params) : db.exec(sql) };
```

`exec` handles multi-statement DDL; `query` handles parameterized statements. **Watch for a memoized
`schemaReady` promise in module scope** — a second in-process DB reuses the cached promise and your
migrations silently don't run. Clear the module cache between scenarios. (Test artifact, not a
production bug — one DB per process there.)

Both bugs in Parts 2 and 3 were found this way.

## Related

- `vercel-hobby-limits` — where these endpoints live under the function cap
- `bkash-payment-integration` — order confirmation emails have the same delivery constraints

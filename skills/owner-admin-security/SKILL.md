---
name: owner-admin-security
description: >-
  Design owner-only access for a small single-operator product — device-bound admin sessions, a
  master recovery key, an inactivity-based failover hierarchy so a lost laptop doesn't lock the owner
  out forever, an audit trail, and safe key rotation. Use when building an admin panel's access
  control, when the user asks "what's the passkey", asks to restrict admin to one device, worries
  about losing access, wants a recovery path, or wants to see who logged in. Covers the fail-open
  trap, why a login must never count as presence, and what to do instead of rolling your own crypto.
---

# Owner-only admin access for a one-person product

The context: one owner, no security team, real customer PII behind the panel, and a genuine risk
that the only device with access dies.

---

## Layer 1 — the admin key

- A single high-entropy `ORDER_ADMIN_KEY` (or equivalent) in the environment. Not a password the
  owner chose.
- Never in a repo, never in client code, never in a log line.
- **Rotating it invalidates every session for free** — that is the emergency lever, so make sure
  session validity actually derives from it (HMAC keyed by the admin key; see `zero-js-admin-panel`).

**Do not roll your own crypto.** HMAC over an expiry, `sha256` both sides before `timingSafeEqual`,
HttpOnly/Secure/SameSite cookie. That is the whole design. Anything more inventive is a liability.

## Layer 2 — first login promotes to a password

The owner's own refinement, and it is the right shape:

> *"After someone logs in the admin panel with the admin key then from then on they use the admin
> password to log in to the admin panel."*

So: the **key** is the bootstrap/recovery credential, the **password** is the daily credential. The
key stays rare, which is what keeps it safe. It also gets accepted on first login — a detail worth
keeping, because otherwise there is a chicken-and-egg on a fresh deploy.

## Layer 3 — device binding

Bind an active session to a device fingerprint (a salted hash of a stable device signal + a
long-lived cookie), so a leaked key alone does not silently hand someone the panel from elsewhere.

**Only one device holds the master panel at a time.** A second device attempting master access is a
visible event, not a silent takeover.

## Layer 4 — inactivity failover hierarchy

The owner designed this himself, and it solves the real risk (device dies, owner locked out) without
weakening the everyday case:

> *"only one device can have the access to the master admin panel but if something happens with that
> device — there is no visit for 15 days straight — the access goes to the next determined Gmail by
> default. and when the device or Gmail being higher in the hierarchy logs in, the panel shifts to
> him."*

Implementation notes:

- An ordered list of successors (email addresses), configured in advance.
- A **last-seen timestamp** per hierarchy level.
- After N days (15) with no presence at level *k*, level *k+1* becomes eligible.
- Higher levels **reclaim on login** — the shift is not permanent, it is a lease.

### The correction that matters

> *"**no, don't count any admin login as presence.**"*

If an admin login counted as presence, an attacker who got in would keep the rightful owner
permanently locked out of the failover — the takeover would sustain itself. Presence must come from a
signal the *legitimate* owner produces, and it must be defined narrowly and deliberately.

This is a good example of a security property that is invisible until you name it.

## Layer 5 — audit trail

Every admin authentication event, every failover state change, every key rotation gets a row:
timestamp, level, device key (hashed), outcome. The panel shows it.

An audit trail nobody reads is still worth having — it is what makes an incident reconstructable.

## Layer 6 — per-device lockout

Rate-limit and lock **per device**, not globally. A global lockout is a denial-of-service against the
owner: anyone who can guess wrong repeatedly can lock him out of his own panel.

---

## The fail-open trap

The most dangerous bug in this area, and it is easy to write by accident:

```js
// WRONG — if the key is unset in the environment, everyone is an admin
if (process.env.ADMIN_KEY && key !== process.env.ADMIN_KEY) return deny();
```

If `ADMIN_KEY` is missing (a fresh environment, a typo'd variable name, a failed env pull), the guard
evaluates false and **the request sails straight through**.

```js
// RIGHT — no key configured means nobody gets in
const expected = process.env.ADMIN_KEY;
if (!expected) return deny('admin not configured');
if (!timingSafeEqualHashed(key, expected)) return deny();
```

**Check for absence explicitly, and fail closed.**

Related trap: **`vercel env pull` returns `""` for Sensitive variables.** An empty read is *not*
evidence the variable is unset — do not "fix" a working deployment based on it.

## Never log or echo the key

- Not in an error message, not in a debug line, not in a redirect URL that ends up in `Referer`.
- The `?key=` route exists for JS-less browsers and must send `Referrer-Policy: no-referrer` and
  `no-store`.
- When the owner asks *"what is the passkey"* — that is a legitimate request from the owner, but
  deliver it through a channel he chose, and note that anything pasted into a chat log is now in a
  chat log.

## Checklist

- [ ] Guard fails **closed** when the key is unset
- [ ] Session validity derives from the key, so rotation kills sessions
- [ ] `timingSafeEqual` on hashed values, never `===` on raw
- [ ] Cookie is HttpOnly + Secure + SameSite
- [ ] Admin login does **not** count as presence for failover
- [ ] Lockout is per-device
- [ ] Audit rows for auth, failover, rotation
- [ ] `no-store` + `noindex` + `no-referrer` on key-in-URL routes
- [ ] Key appears in **zero** log lines

## Related

- `zero-js-admin-panel` — the panel this protects
- `no-code-owner-handoff` — how to explain rotation to someone who won't read a runbook

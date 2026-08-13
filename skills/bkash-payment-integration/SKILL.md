---
name: bkash-payment-integration
description: >-
  Take money in Bangladesh — the manual bKash/Nagad TrxID flow for small sellers, and the full bKash
  PGW tokenized-checkout integration for merchants. Use when the user mentions bKash, Nagad, "mobile
  banking", a merchant account, taking payments in Bangladesh, a book/product checkout for a BD
  audience, delivery charge by zone, or a payment that "went through but the order didn't update".
  Carries the correct flow, the non-negotiable money-safety rules (server-side pricing, idempotent
  callback, never mark failed on a callback error), the sandbox-credential dead end, and the go-live
  review gate. Not for Stripe/PayPal/international gateways.
---

# Taking payments in Bangladesh

Two integration levels. Picking the wrong one wastes weeks.

| | Manual TrxID | bKash PGW (tokenized checkout) |
|---|---|---|
| Needs a merchant account | no | **yes** |
| Money verified automatically | no | yes |
| Seller work per order | reconcile by hand | none |
| Time to ship | hours | weeks (incl. their review) |
| Right for | a first product, low volume | real volume, or when you can't reconcile by hand |

**Ship the manual flow first unless there is a reason not to.** It is not embarrassing; it is what
most Bangladeshi sellers actually run, and it gets you selling this week.

---

## Part 1 — manual bKash / Nagad TrxID flow

Customer pays from their own app to your number, then types the **transaction ID** into the order
form. You reconcile in an admin panel.

**Order form must capture:** name, phone (normalized), address, city/area, quantity, **delivery
zone** (Dhaka vs outside Dhaka is a different price), payment method (bKash | Nagad), and the TrxID.

**Rules:**

- Show a **live total** that includes delivery, computed the same way on the server.
- The TrxID field is free text — do **not** validate it into a fake format. Formats change.
- Order status walks `pending → verified → shipped`. Nothing is `paid` until a human checks.
- The admin list needs the TrxID visible and copyable, because reconciliation happens in the bKash
  app on a phone.
- **Never auto-confirm.** A typed TrxID is a claim, not a payment.

Honeypot field on the form; filled → silently accept, do not store.

---

## Part 2 — bKash PGW, tokenized checkout

### The flow (URL redirect, not iframe — so your CSP does not change)

```
/order form
  → POST /api/order-create
      validate → compute amount SERVER-SIDE → insert order `initiated`
      → bKash Grant-Token → Create-Payment  → returns bkashURL
  → browser redirects to bKash's hosted page
  → bKash redirects to GET /api/bkash-callback?paymentID=…&status=…
      → Execute-Payment
      → verify transactionStatus === 'Completed'  AND  amount === order.amount
      → mark `paid`, store trxID + paid_at, email buyer + owner
      → 302 to /order?status=success
```

Base URLs — sandbox `tokenized.sandbox.bka.sh`, production `tokenized.pay.bka.sh`, both
`/v1.2.0-beta/tokenized/checkout`. Create mode `'0011'`. Success is bKash `statusCode === '0000'`.

### Non-negotiable money rules

1. **The amount is computed on the server.** `price × qty + shipping`, from server-side config. A
   client-submitted total is never trusted, ever.
2. **Execute re-verifies the amount** before marking paid. Create-time agreement is not enough.
3. **The callback is idempotent.** A replay must not create a second paid row or a second ebook
   grant. Enforce it with a UNIQUE constraint (`invoice` on orders, `order_id` on grants), not with
   an `if` statement.
4. **A callback error leaves the order `initiated` — NOT `failed`.** bKash may already have taken the
   money. `failed` is a lie that loses a customer's cash. A reconcile pass has to be able to finish
   it later.
5. **Provide a reconcile endpoint** using Query-Payment, keyed by invoice and protected by an admin
   key, for callbacks that never arrived.
6. **bKash secrets are server-only.** They never reach the browser, never reach a client bundle.
7. **Expose a public read-only price endpoint** (`/api/order-config`) so the page total physically
   cannot drift from the server's.

### Token handling

Cache the grant token, and **retry once on 401** — the token expires and the first call after
expiry fails in a way that looks like bad credentials.

### The sandbox dead end — read before you burn a day

**bKash's public shared sandbox credentials are dead.** Grant-token returns:

```
9999 "Invalid or unrecognized access credentials"
```

This is not your bug. You need **your own** sandbox app key / secret / username / password from the
merchant sandbox portal. Until then, the correct state is: full path built, errors surfaced
gracefully as a 502, a `failed` order row stored, and the whole thing **dormant** — buy button
hidden, endpoints 503 politely.

### Go-live is a human gate

bKash runs a **manual go-live / UAT review of your integration**. It is their process, not
self-serve. Budget for it. Sequence:

1. Owner obtains merchant + PGW API account.
2. Set production `BKASH_*` + `BKASH_MODE=production` + real prices.
3. Pass bKash's review.
4. Flip the on-sale flag, deploy.
5. Do **one small real transaction**, confirm it lands in the merchant wallet and the order shows
   `paid`, then refund it.

### Environment variables

```
BKASH_MODE=sandbox|production
BKASH_APP_KEY  BKASH_APP_SECRET  BKASH_USERNAME  BKASH_PASSWORD
BOOK_PRICE_BDT  BOOK_SHIPPING_BDT
SITE_URL  ORDER_ADMIN_KEY
```

**Gotcha:** piping a value into `vercel env add` appends a newline that silently breaks every
comparison. Trim on read. And `vercel env pull` returns `""` for Sensitive vars — an empty read is
not evidence the variable is unset.

---

## Testing without a live gateway

`@electric-sql/pglite` runs real Postgres in WASM — no Docker, no network — and a mocked bKash HTTP
layer covers the rest. A suite built this way caught real defects and covers:

create → pay → verify → paid · **idempotent replay** · cancel · **amount-tamper rejection** ·
validation · honeypot · reconcile · BD-phone normalization (`+880` / `880` / `01…` / dashes).

The one thing that is **not** self-verifiable is the round-trip on bKash's own hosted page. Say so
rather than implying full coverage.

## Phone normalization

One shared implementation, reused by checkout, any reader gate, and booking. Never two — two
implementations of a phone rule drift and then the same customer is two customers.

## Related

- `vercel-hobby-limits` — the function cap that shapes where these endpoints live
- `owner-admin-security` — protecting the reconcile + stats endpoints
- `bd-import-export-domain` — the audience these products sell to

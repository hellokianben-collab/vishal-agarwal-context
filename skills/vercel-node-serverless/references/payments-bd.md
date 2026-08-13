# Manual bKash / Nagad payment + order flow (Bangladesh)

Most small Bangladeshi sellers don't have an approved payment-gateway merchant
account, so the practical, ship-today flow is **manual TrxID verification**:

1. Customer picks bKash or Nagad, opens the app, does **Send Money** to the
   owner's personal number, copies the **Transaction ID (TrxID)** from the
   confirmation SMS.
2. Customer submits the order form with name, phone, address, delivery zone,
   quantity, method, and TrxID.
3. Server saves the order (status `pending`), emails the owner, and shows a
   "we'll verify within 24h" confirmation.
4. Owner checks the TrxID in their bKash/Nagad app, then marks the order
   **verified → shipped → delivered** in the admin panel.

No merchant account, no API keys, works immediately. Design it so the official
APIs slot in later (see "Phase 2 seam" below).

## Non-negotiable server rules

**Compute price server-side. Never trust the client total.** The browser can be
tampered with. Store price + delivery charges in config and recompute:
```js
const unitPrice      = Number(cfg.price) || 0;
const deliveryCharge = zone === 'dhaka' ? Number(cfg.deliveryDhaka) : Number(cfg.deliveryOutside);
const total          = unitPrice * qty + deliveryCharge;   // authoritative
```

**Guard against duplicate TrxID submissions** (double-submit, or a customer
reusing an old TrxID). Reject if the same TrxID already exists in a non-rejected
order:
```js
const dup = await store.findPendingByTrx(trxId);
if (dup) return res.status(400).json({ message: 'This Transaction ID was already submitted.' });
```

**Validate BD specifics.** Normalize phone (`+880`/`880` → `0`) and validate
`^01[3-9]\d{8}$`. TrxIDs are alphanumeric `^[A-Za-z0-9]{6,20}$`. Delivery zone is
one of `dhaka` / `outside` mapping to two configured charges.

**Escape every user field in emails/admin HTML.** Name, address, TrxID, sender
number are all attacker-controlled. Run them through an HTML escaper before
interpolating into any template literal.

**Await the emails before responding** — see §4 of the main SKILL (serverless
freezes trailing async).

## Owner-editable config

Keep price, delivery charges, bKash/Nagad numbers, and an `available` flag in a
config record the owner edits from the admin panel — so they set the real price
and numbers without a redeploy. Expose only the public subset from the public
config endpoint (never leak gateway internals).

## Admin panel: extend, don't fork

Admin SPAs that render tabs by convention usually need four wiring points for a
new tab (all by copying an existing tab):
1. a sidebar button `<button class="sidebar-btn" data-tab="book-orders">`
2. a content div `<div id="tab-book-orders" class="admin-tab hidden">`
3. a `titles` map entry for the topbar heading
4. an `if (tab === 'book-orders') loadX()` line in the tab switcher

Order-status buttons should offer only the valid next transitions
(`pending → verified|rejected`, `verified → shipped`, `shipped → delivered`), and
list loaders must render an **error** state on a non-`res.ok` response — don't let
a 500 render as the empty "no orders" state, or the owner thinks paid orders
don't exist. Refresh the pending badge after every status change/delete.

## Phase 2 seam — official gateways later

Put a tiny gateway interface in front so the manual flow and future APIs share a
shape, selected by a `gateway` field in config:
```js
const gateways = {
  manual: { createPayment: async () => { throw new Error('customer pays via Send Money'); },
            verifyPayment: async () => ({ verified: false, manual: true }) }
  // 'bkash-pgw': bKash Tokenized Checkout  (grant token → create → execute → query)
  // 'nagad-api': Nagad Merchant API        (initialize → complete → verify)
};
module.exports = { get: name => gateways[name] || gateways.manual };
```
When the merchant account is approved, implement the same two methods with the
real API and flip `config.gateway`. Future bKash env vars: `BKASH_APP_KEY`,
`BKASH_APP_SECRET`, `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_BASE_URL`.

## Order record shape (reference)

```
{ id, name, phone, email, address, zone ('dhaka'|'outside'), qty,
  method ('bkash'|'nagad'), trxId, senderNumber,
  unitPrice, deliveryCharge, total,
  status ('pending'|'verified'|'shipped'|'delivered'|'rejected'), created_at }
```
Persist it in Postgres in production (see the store adapter) — orders on a
JSON-file store evaporate on Vercel.

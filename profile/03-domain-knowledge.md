# Domain knowledge Vishal brings (and you probably don't have)

This is the part of the context that is *not* recoverable from a codebase. It is why his products
are correct and why generic AI answers about Bangladesh trade are usually wrong.

Treat everything here as **his expertise, encoded**. When a task touches it, defer to these facts
over general knowledge, and when you extend them, mark clearly what is his and what is your
inference.

---

## 1. The NBR duty cascade — why Bangladeshi importers get destroyed by "a 25% duty"

Bangladesh's National Board of Revenue applies import taxes as a **compounding cascade**, not as
parallel percentages of the assessable value. Each layer is charged on a base that already includes
the layers before it:

```
AV   = Assessable Value (CIF + landing charge)
CD   = Customs Duty            on  AV
RD   = Regulatory Duty         on  AV
SD   = Supplementary Duty      on (AV + CD + RD)
VAT  = Value Added Tax         on (AV + CD + RD + SD)
AT   = Advance Tax             on (AV + CD + RD + SD)
AIT  = Advance Income Tax      on  AV
```

**Consequence:** a headline "25% customs duty" line routinely becomes **80–130% total tax
incidence** once SD, VAT and AT compound on top of it. Importers who budget off the CD number alone
lose the margin on the container. This single misunderstanding is the reason the `landed` calculator
exists.

**Data:** the calculator carries the real **FY2026-27 Operative Tariff — 7,465 HS codes**, with
lookup, description search, and a confirm/revert override flow.

**Hard accuracy constraint that must never regress:** the duty profiles are **indicative, not a
customs assessment**. The page carries a warning callout saying so. Nobody — user, assistant, or
marketing copy — may present the output as an official assessment.

---

## 2. Letter of Credit discrepancies — where garment export money actually dies

Bangladesh's garment exporters get paid through **Letters of Credit governed by UCP 600**. The bank
examines the document presentation, and *any* mismatch between the L/C and the shipping documents
lets it refuse payment. A single discrepancy can delay or block payment on an entire shipment, or
trigger a $10k–100k+ buyer chargeback.

The rules that matter, encoded as a working engine in GarmentMind (severity in brackets):

| Check | Sev |
|---|---|
| Currency consistent across all documents | critical |
| Invoice amount ≤ L/C amount (+tolerance) — **over-drawing** | critical |
| Invoice arithmetic: line qty × price = amount; lines sum to total | high |
| Total quantity consistent across invoice/packing list/PO — **UCP 30(b) ±5%** | critical |
| Goods description *corresponds with* the L/C (fuzzy, not literal) | high |
| Incoterm consistent | high |
| Beneficiary (exporter) matches the L/C | high |
| Applicant (buyer) matches the L/C | high |
| Shipment date ≤ L/C latest shipment date | critical |
| All documents dated within L/C expiry | critical |
| Ports of loading / discharge match the L/C | high |
| PO number consistent | medium |
| Gross weight: packing list vs bill of lading | medium |
| Carton count: packing list vs bill of lading | medium |
| Unit price: invoice vs PO | high |
| HS code present on invoice lines | low |
| Country of origin consistent | medium |
| Every L/C-required document actually present | high |

**Design rule that came out of this:** a rule must fire **only when its required fields are
present**. Missing data must never produce a false positive — a checker that cries wolf on an
incomplete extraction is worse than no checker, because the merchandiser stops reading it.

**Pass gate:** a document set passes only with **no CRITICAL and no HIGH** findings.

---

## 3. The Bangladesh market reality that kills most "AI for X" pitches

Established through an adversarial investor review that Vishal specifically asked for, and it now
constrains product strategy:

- **Labor-savings pitches are dead in this market.** Bangladesh labor runs ~$1–2/hr; a merchandiser
  costs ~$150–400/month. "Save hours of data entry" is worth almost nothing. Automating cheap labor
  is a weak ROI story here even when the automation works perfectly.
- **Sell error prevention and cashflow, not time.** The money is in stopping a costly failure — a
  blocked L/C payment, a chargeback, a container stuck at port.
- **The AI is not the moat.** Extraction is a commodity; anyone can call a model. The moat is the
  **domain rules engine**, the workflow, the trust, and the factory relationships.
- **Wedge, prove willingness to pay, then expand.** Build the thinnest useful thing, get 3 real
  factories running real documents, charge money. Only build the broader platform if they pay.
- Honest blended investor rating of the GarmentMind idea as originally framed: **~6/10** — real
  problem, thin moat, weak in-market willingness to pay, only worth building narrowed to the
  error-prevention wedge.

---

## 4. Shared imports — the KiAnben model

Small Bangladeshi traders cannot fill a container alone, so they **pool** into shared imports.
KiAnben is the community layer for that: a cargo board where members post what they want to bring
in, membership applications, pricing, and admin-managed import orders.

Implications a generic e-commerce assumption gets wrong:
- The unit of demand is **a slot in someone else's container**, not a product in a cart.
- Delivery zone matters more than address (Dhaka vs outside Dhaka is a different price).
- Trust is the product. The board and the member roster are the moat, not the checkout.

---

## 5. Bangladesh payments — bKash and Nagad

There are two very different integration levels and they are constantly confused:

**Manual TrxID flow (works today, no merchant account needed)**
Customer pays to a personal/merchant number from their own bKash or Nagad app, then types the
**transaction ID** into the order form. The seller reconciles by hand in an admin panel. This is how
KiAnben's book shop works. It is not glamorous, and it is the correct answer for a small seller.

**bKash PGW — tokenized checkout (built, dormant, waiting on merchant credentials)**
The real gateway: Grant-Token → Create-Payment → hosted bKash page → callback → Execute-Payment →
verify → mark paid.

Non-negotiable rules that came out of building it:
- **The amount is computed server-side, always.** Never trust a client-submitted total.
- **Execute re-verifies the amount** before marking an order paid.
- **The callback must be idempotent** — a replay must not produce two paid rows or two ebook grants.
- **A callback error leaves the order `initiated`, never `failed`** — bKash may already have taken
  the money, and a reconcile pass has to be able to finish it.
- bKash runs a **manual go-live / UAT review of your integration**. It is their gate, not
  self-serve. Budget for it.
- The public shared sandbox credentials are **dead** (`9999 Invalid or unrecognized access
  credentials`). You need your own sandbox app key from the merchant portal.

---

## 6. Bangladesh-specific data and formatting rules

- **Phone numbers** normalize through one shared rule: `+880` / `880` / `01…` / dashes all collapse
  to a single canonical BD mobile form. One implementation, reused by checkout, reader gate, and
  booking — never two.
- **Locations:** 570 English Bangladeshi place names (upazila "Area, District" + district names),
  built from the `bangladesh-geocode` dataset. English only.
- **Times are Bangladesh time end to end.** A naive datetime that silently lands six hours off is
  worse than no appointment at all.
- **The Taka sign `৳` is U+09F3 — inside the Bengali Unicode block.** On an English-only site, write
  `Tk`. This is an easy way to accidentally violate the no-Bengali rule.

---

## 7. A macroeconomic proposal he authored

In July 2026 Vishal wrote and iterated a serious conceptual proposal: **a Bangladesh-based global
settlement network denominated in BDT**, with a government equity stake funding a cashback
mechanism. He explicitly asked for it to be attacked, not praised — funding sustainability, what
happens in loss years, what happens if the government cannot cover the shortfall.

Relevant because it tells you the altitude he thinks at: he is not only building websites, he is
designing mechanisms. When he brings an idea, **stress-test it** — see
`skills/ruthless-venture-review`.

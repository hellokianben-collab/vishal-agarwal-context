---
name: bd-import-export-domain
description: >-
  Bangladesh import/export domain knowledge for building tools, content or advice for traders — the
  NBR compounding duty cascade, HS codes and the Operative Tariff, landed-cost calculation, Letter of
  Credit / UCP 600 discrepancies that block payment, shared-container imports, and the market
  realities that kill most "AI for X" pitches here. Use when the task involves Bangladeshi importers
  or exporters, customs duty, HS codes, landed cost, CIF/assessable value, L/C or bank document
  presentation, garment export, freight or clearing, shared imports, or writing content aimed at BD
  traders. Not a substitute for a licensed clearing agent — outputs are indicative, never an
  assessment.
---

# Bangladesh import/export domain

Encoded expertise, not general knowledge. When a generic answer about "import duty" conflicts with
this file, this file is right.

---

## 1. The NBR duty cascade — the single most important fact

Bangladesh import taxes **compound**. Each layer is charged on a base that already includes the ones
before it:

```
AV   = Assessable Value  (CIF + landing charge)

CD   = Customs Duty          × AV
RD   = Regulatory Duty       × AV
SD   = Supplementary Duty    × (AV + CD + RD)
VAT  = Value Added Tax       × (AV + CD + RD + SD)
AT   = Advance Tax           × (AV + CD + RD + SD)
AIT  = Advance Income Tax    × AV
```

**A "25% duty" line routinely becomes 80–130% total tax incidence.**

Worked example — the number that surprises people. CIF $10,000, CD 25%, RD 3%, SD 20%, VAT 15%,
AT 5%, AIT 5%:

```text
AV               10,000
CD  25% × AV      2,500      →  running 12,500
RD   3% × AV        300      →  running 12,800
SD  20% × 12,800  2,560      →  running 15,360
VAT 15% × 15,360  2,304
AT   5% × 15,360    768
AIT  5% × AV        500
                 ------
total tax         8,932      = 89.3% of CIF, from a "25%" duty line
```

Verify any implementation against this case before shipping it:

```bash
node -e "
const AV=10000, CD=.25*AV, RD=.03*AV, SD=.20*(AV+CD+RD);
const VAT=.15*(AV+CD+RD+SD), AT=.05*(AV+CD+RD+SD), AIT=.05*AV;
console.log((CD+RD+SD+VAT+AT+AIT).toFixed(0));   // 8932
"
```

Anyone who budgets off CD alone loses the margin on the container. This is *the* recurring, expensive
mistake among small Bangladeshi importers, and the reason a landed-cost tool is worth building.

**When you compute this, show every layer.** A single total number teaches nothing and gets
distrusted. The cascade is the insight.

## 2. HS codes and the Operative Tariff

- Rates come from the **NBR Operative Tariff**, published per fiscal year (current dataset here:
  **FY2026-27, 7,465 codes**).
- A tool should support **code lookup and description search**, because traders usually know the
  goods, not the code.
- Automated code matching is often wrong. Provide a **confirm / revert override flow** — let the user
  correct the match and see the number change.
- HS code presence on invoice lines is itself a document-compliance item (see §3).

**Hard rule: output is indicative, not a customs assessment.** Carry a visible warning. Do not let a
UI, a marketing line, or an assistant's summary imply otherwise. Actual assessment happens at
customs, by a clearing agent, on the real documents.

## 3. Letters of Credit and UCP 600 — where export money dies

Bangladeshi garment exporters are paid via L/C. The bank examines the presented documents against
the credit, and **any** mismatch lets it refuse payment. One discrepancy can delay or block payment
on a whole shipment, or trigger a $10k–100k+ chargeback.

The document set: **L/C · commercial invoice · packing list · bill of lading · purchase order.**

Checks that matter, by severity:

**Critical** — currency consistent across documents · invoice ≤ L/C amount (over-drawing) · total
quantity consistent, **UCP 30(b) ±5%** tolerance · shipment date ≤ latest shipment date · all
documents dated within L/C expiry

**High** — invoice arithmetic (qty×price=amount, lines sum to total) · goods description
*corresponds with* the L/C · incoterm consistent · beneficiary matches · applicant matches · ports of
loading/discharge match · unit price invoice vs PO · every L/C-required document present

**Medium** — PO number consistent · gross weight packing list vs B/L · carton count packing list vs
B/L · country of origin consistent

**Low / info** — HS code present on invoice lines · low extraction confidence → human review

Two engineering rules that come from the domain, not from software:

1. **A check fires only when its required fields are present.** Missing data must never produce a
   false positive. A checker that cries wolf gets ignored, and an ignored checker is worse than none.
2. **State the consequence and the fix, not the mismatch.** "Quantity differs" is noise. "Invoice
   over-draws the L/C by $4,200 — the bank will refuse under UCP 600 art. 18; amend the invoice or
   request an L/C amendment" is a finding.

Pass gate: **no critical and no high.**

## 4. Shared-container imports

Small traders cannot fill a container, so they pool. This changes the product shape:

- The unit of demand is **a slot in someone else's container**, not an item in a cart.
- Trust is the product. The member roster and the board are the moat; the checkout is not.
- Delivery pricing is **zonal** (Dhaka vs outside Dhaka), not per-address.

## 5. Market realities that kill most "AI for X" pitches here

Established through adversarial review and now treated as strategy constraints:

- **Labor-savings pitches are dead.** Labor is ~$1–2/hr; a merchandiser is ~$150–400/month. "Save
  hours of data entry" is worth almost nothing.
- **Sell error prevention and cashflow.** Stopping a blocked payment, a chargeback, or a container
  stuck at port is where the money is.
- **The AI is not the moat.** Extraction is a commodity. The **domain rules** are the moat.
- **Wedge → prove willingness to pay → expand.** Get three real customers running real documents and
  paying before building the platform.
- Expect long sales cycles and relationship-driven buying. A self-serve signup form is not a go-to-
  market here.

## 6. Formatting and data rules

- **Phone:** one canonical BD mobile normalizer (`+880` / `880` / `01…` / dashes → one form), reused
  everywhere. Never two implementations.
- **Locations:** 570 English place names (upazila "Area, District" + district), from the
  `bangladesh-geocode` dataset.
- **Times:** Bangladesh time end to end. A naive datetime silently six hours out is worse than none.
- **The Taka sign `৳` is U+09F3 — inside the Bengali Unicode block.** On an English-only surface,
  write `Tk`. Easy way to accidentally break a no-Bengali rule.
- **Currency on a trader tool is not a detail.** Invoice currency handling has already shipped wrong
  once.

## 7. Language

The audience is Bengali-speaking. The products here are deliberately **English-only** — that is an
owner decision, not an oversight. YouTube titles that are genuinely Bengali get shown as English
translations rather than transliterated.

If generating imagery with text, note that **Pillow without `raqm` cannot shape Bengali** — it
renders as broken glyphs. Use Latin transliteration for drafts.

## 8. Checklist before shipping anything that quotes a duty or a document rule

- [ ] Every cascade layer is shown, not just a total
- [ ] The worked example in §1 reproduces exactly (`8932` on a $10,000 CIF)
- [ ] The tariff dataset's fiscal year is stated on screen (currently **FY2026-27, 7,465 codes**)
- [ ] An "indicative, not a customs assessment" warning is visible, and survives redesigns
- [ ] HS-code matches are user-correctable, with the total updating on override
- [ ] No rule fires on missing data
- [ ] Every finding names the consequence and the fix, not just the mismatch
- [ ] Phone numbers pass through one shared normalizer
- [ ] No Bengali codepoints, including `৳` (U+09F3), on an English-only surface

```bash
# language regression gate — must return nothing
grep -rlP '[\x{0980}-\x{09FF}]' --include='*.html' --include='*.js' . && echo "Bengali present"
```

*Facts in this file were established between 12 July and 1 August 2026 and re-checked
13 August 2026. The tariff dataset changes each fiscal year — re-date §2 when it does.*

## Related

- `bkash-payment-integration` — how these customers actually pay
- `ruthless-venture-review` — the review method that produced §5
- `content-integrity-guard` — the "indicative, not an assessment" rule as a hard gate

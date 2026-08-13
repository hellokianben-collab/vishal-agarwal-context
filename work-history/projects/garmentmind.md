# GarmentMind AI — L/C discrepancy checker

**Status:** v0.1 working demo, **not production-reliable** · **Started:** 12 Jul 2026 ·
**Stack:** FastAPI + React + Postgres, Vercel · **Deep skill:** `skills/garmentmind` ·
**Live:** garmentmind.vercel.app

The first attempt at an actual SaaS company rather than a website. Briefed as:

> *"You are my Technical Co-Founder, Lead AI Engineer, Product Manager, and Software Architect…
> This is **NOT** a demo project."*

---

## The wedge

Bangladesh's garment exporters get paid through **Letters of Credit under UCP 600**. The bank
examines the presented documents, and any mismatch lets it refuse payment. GarmentMind reads a set
of related trade documents — L/C, commercial invoice, packing list, bill of lading, purchase order —
and flags every discrepancy **before the bank sees them**.

## The investor review that reshaped it

Before building, Vishal asked for the idea to be attacked by *"a Garment business owner and an expert
investor who has 30+ years of business experience."* The review returned a **~6/10** and killed the
original framing. What survived and is now permanent strategy:

- **The labor-savings pitch is dead here.** Bangladesh labor is ~$1–2/hr, a merchandiser ~$150–400
  a month. "Save hours of data entry" is worth almost nothing.
- **Sell error prevention and cashflow.** A blocked L/C payment or a $10k–100k buyer chargeback is
  the value.
- **The AI is not the moat.** Extraction is a commodity. The **domain rules engine** is the moat.
- **Wedge → prove willingness to pay → expand.** Build the thinnest useful thing, get 3 real
  factories running real documents, charge money. Do not build the nine-phase cathedral first.

He accepted the verdict in the same session and adjusted the plan. That is worth noting about how he
works.

## Architecture

```
API (FastAPI routers) → Services → Domain (extraction + discrepancy engine) → DB
                                    └─ StoragePort (local / S3)
```

Endpoints hold no business logic and never touch the DB directly. **The discrepancy engine only ever
sees a canonical `ExtractedDocument`** — never a raw PDF, never provider JSON. That single decoupling
is why the AI provider and the database can both be swapped without touching the rules.

## The engine

~18 UCP-600-grounded rules, each a `(RuleContext) -> list[Finding]`. Full table in
`profile/03-domain-knowledge.md`. Two design rules that matter more than the rule list:

1. **A rule fires only when its required fields are present.** Missing data must never produce a
   false positive — a checker that cries wolf on an incomplete extraction gets ignored, and an
   ignored checker is worse than none.
2. **Severity maps to a real consequence**, stated in the finding, with the fix. "Mismatch found" is
   not a finding; "invoice over-draws the L/C by $4,200, UCP 600 art. 18 — bank will refuse" is.

Pass gate: **no CRITICAL and no HIGH**.

## What actually works today

- Upload a document set (or run built-in samples) → canonical extraction → rule engine →
  severity-ranked report with per-document conflicting values and a fix per finding
- Auth (register company, JWT, Argon2id) and **multi-tenant isolation** — `company_id` on every
  table, with a passing automated test that one company cannot read another's reports
- Report persistence, history, React UI with an instructions drawer
- 15/15 backend tests green, `ruff` clean, deployed

## The honest gaps — do not oversell this

- **Extraction is MOCK.** The default provider returns fixture data keyed off the *filename*. It
  does not read real PDFs. The Claude adapter is written but **has never been run once** with a real
  key or a real document.
- **The database is throwaway.** On Vercel it is `/tmp` SQLite — resets on cold start, not shared
  across serverless instances.
- **Rules were tuned on synthetic samples**, never on a real factory L/C. Tolerances and fuzzy-match
  thresholds will need real-document tuning.
- **No independent audit of the money-critical logic yet.** The adversarial review workflow was
  killed by a usage limit before it ran.

This gap list is kept deliberately visible in the project skill. It is the reason nobody has been
charged yet.

## Next

Real extraction against three real factories' documents, a durable Postgres, then pricing.

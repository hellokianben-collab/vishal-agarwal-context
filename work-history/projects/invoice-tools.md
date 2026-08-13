# Invoice tools — two separate attempts at the same problem

Trade paperwork is where Vishal's own time goes, so it has been attacked twice from opposite ends.

---

## 1. `invoice-assistant` — the ambitious backend (9 Jul 2026)

**Status:** backend scaffolded, not shipped · **Location:** `Desktop/claude/invoice-assistant` ·
**Stack:** FastAPI + Docker Compose

Briefed as a production AI SaaS:

> *"You are a Senior AI Software Engineer and Solutions Architect with experience building
> production-grade AI SaaS products… Think like a CTO designing a complete AI-powered Invoice
> Processing Assistant from scratch."*

A backend and a `docker-compose.yml` exist. It never reached a live URL, and the effort moved to
GarmentMind three days later — which is arguably the same problem (trade documents, extraction,
validation) attacked with a much sharper wedge.

**Worth knowing:** this is the pattern where the *second* framing of a problem was the good one. The
generic "invoice processing assistant" had no wedge. "Catch the discrepancy that blocks your L/C
payment" had one.

---

## 2. `/invoice` — the free generator that actually shipped

**Status:** live at `iamvishalagarwal.com/invoice` · **Stack:** static HTML/CSS/JS

A no-signup invoice generator, ported from a `quickbill` prototype and mounted onto the main domain
alongside the landed-cost calculator, then folded into the `/community` surface.

Deliberately the opposite of the first attempt: no backend, no auth, no AI, no database. It works,
it is free, it needs no maintenance, and it gives the community page a second reason to exist.

**One real bug worth recording:** the invoice currency was wrong on first ship and had to be fixed —
a reminder that on a tool for traders, currency handling is not a detail.

---

## Why both are in this repo

Together they are the clearest example of Vishal's actual product instinct: he will happily
commission the ambitious version, but he ships the one that reaches users. The static generator has
been live and useful for two weeks; the FastAPI service never got a URL.

When proposing scope to him, that ratio is the argument to make.

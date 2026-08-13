# Other work — proposals, experiments, and the iterations that got replaced

Not everything here shipped. Several of these mattered more than things that did.

---

## A BDT-denominated global settlement network (28–29 Jul 2026)

**Type:** written economic proposal, authored by Vishal · **Status:** iterated, judged, not published

A conceptual mechanism for transforming Bangladesh into a settlement hub with international payments
denominated in **BDT**, including a government equity stake funding a cashback mechanism for
participants.

He framed it himself as *"a conceptual economic proposal intended for discussion and improvement. It
is not a finalized policy. The goal is to identify strengths, weaknesses, and possible solutions
through open discussion"* — and then asked for it to be attacked on exactly the right axes:

> *"1. If the government's 5% equity does not generate enough annual return, how is the remaining
> cashback funded? 2. What happens during years when the invested assets lose value? 3. If the
> government bo[rrows to cover it]…"*

He then asked for **judges' scores**, i.e. a panel evaluation rather than one opinion.

**Why it belongs in an AI-context repo:** it establishes the altitude he works at. He is not only
commissioning websites — he designs mechanisms and wants them stress-tested. Assistants that treat
him as a "small business owner needing a landing page" are calibrated wrong.

---

## OpenMontage (12 Aug 2026)

**Type:** third-party open-source project, cloned and set up ·
**Repo:** `github.com/calesthio/OpenMontage`

An AI video/montage pipeline (Remotion composer, pipeline definitions, an "ink-theater" renderer).
Cloned with `make setup` and brought to a runnable state. ~12,600 files.

Relevant as **capability acquisition**, not as authored work: it sits directly upstream of the
autonomous-YouTube-channel ambition, which needs automated video assembly.

---

## The three portfolio iterations before the current site

The live `iamvishalagarwal.com` is the **fourth** attempt. The earlier ones are still on disk and are
a useful record of what was learned.

| Folder | Stack | Fate |
|---|---|---|
| `Vishal Agarwal Personal WEB` | Next.js | Abandoned — 3 Jun, the first attempt |
| `Final web vishal` | plain HTML/CSS/JS + Node | 4 Jun, the deliberate move away from a framework |
| `Vishal web trial 3` | Next.js + 3D | 8 Jun, where the "modern 3D site" pipeline was worked out; produced the `ship-modern-3d-site` skill |
| `Vishal web trial 4` | static HTML/CSS/JS | 11–15 Jun, the site that actually went live on the domain first — hero, 3D pyramid, laptop scroll-zoom, theme toggle |
| `vishal-site` | static + serverless + Postgres | **current**, from 15 Jul |

**The pattern:** every iteration moved *away* from framework complexity and *toward* direct control
of the output. The current site has no build step at all. That was a considered choice after trying
the alternative twice, not a limitation.

**Caution for any assistant:** several of these old folders still link to the same Vercel project
IDs. Confirm which folder is live by matching the `?v=N` cache-buster in the deployed HTML against
the folder's `index.html` before deploying anything.

---

## Requested but not yet decided

**Autonomous YouTube channel agent** (12 Aug 2026) — an agent that picks its own topic, creates a
channel, produces and schedules one 10+ minute video per day using only free tools, and grows it to
1M subscribers.

Scoped honestly in `skills/autonomous-channel-plan`. Short version: the pipeline is buildable, the
"free tools only" constraint is the real binding limit, and the 1M target is a *goal*, not a plan.
The skill says so plainly rather than promising the number back to him.

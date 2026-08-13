# Scorecard — 27 skills

Generated **13 August 2026** by `node tools/score-skills.mjs`. Rubric: [`RUBRIC.md`](RUBRIC.md).

```
27 skills · mean total 69.3/100 · range 44–89
A (90+)  0        B (80–89) 1        C (70–79) 13        D (60–69) 10        F (<60) 3
```

**No skill reached the A band.** The ceiling is 89. That is the honest result of a rubric where 90
means exceptional, and it is left as-is rather than tuned upward.

Reproduce it yourself:

```bash
node tools/score-skills.mjs
node tools/score-skills.mjs --json    # per-dimension detail + every flag
```

---

## The table

| # | Skill | Total | Mach /60 | Human /40 | Band | Biggest weakness (from the scorer) |
|---|---|---|---|---|---|---|
| 1 | `vishal-agarwal-site` | **89** | 57 | 32 | B | 1,150 lines with no `references/` split |
| 2 | `claude-code-setup-ops` | **79** | 46 | 33 | C | Few verbatim error strings; undated |
| 3 | `session-to-project-skill` | **77** | 44 | 33 | C | No negative scope; only 4 command lines |
| 4 | `prove-before-claiming` | **76** | 41 | 35 | C | No explicit "use when" clause in the description |
| 5 | `vercel-node-serverless` | **75** | 42 | 33 | C | No negative scope; undated |
| 6 | `responsive-reveal-audit` | **74** | 40 | 34 | C | 0 command lines in `SKILL.md` (they're in `scripts/`) |
| 7 | `self-improving-agent-loop` | **74** | 41 | 33 | C | Only 1 quoted trigger phrase |
| 8 | `zero-js-admin-panel` | **74** | 40 | 34 | C | Only 1 quoted trigger phrase; no negative scope |
| 9 | `email-capture-and-delivery` | **73** | 39 | 34 | C | Only 1 quoted trigger phrase; no negative scope |
| 10 | `vercel-hobby-limits` | **73** | 42 | 31 | C | Undated — and it is *all* vendor numbers |
| 11 | `bkash-payment-integration` | **72** | 44 | 28 | C | 0 runnable commands; Bangladesh-only reuse |
| 12 | `windows-agent-automation` | **72** | 39 | 33 | C | Only 2 command lines despite being a shell skill |
| 13 | `garmentmind` | **71** | 44 | 27 | C | 1 code block; no negative scope |
| 14 | `no-code-owner-handoff` | **70** | 39 | 31 | C | 0 quoted trigger phrases |
| 15 | `social-media-agent` | **69** | 38 | 31 | D | 1 code block; 0 commands in `SKILL.md` |
| 16 | `work-within-usage-limits` | **69** | 37 | 32 | D | 1 code block; thin on runnable material |
| 17 | `bd-import-export-domain` | **68** | 43 | 25 | D | Knowledge not procedure; tariff data expires annually |
| 18 | `brand-media-pipeline` | **68** | 41 | 27 | D | 0 quoted trigger phrases; no negative scope |
| 19 | `owner-admin-security` | **68** | 37 | 31 | D | 0 runnable commands for a security skill |
| 20 | `kianben-web` | **66** | 39 | 27 | D | **0 code blocks** in the whole skill |
| 21 | `content-integrity-guard` | **65** | 34 | 31 | D | Lowest machine score of the new skills — short by design |
| 22 | `ruthless-venture-review` | **65** | 37 | 28 | D | 0 commands; method not procedure |
| 23 | `public-data-without-api-keys` | **62** | 36 | 26 | D | **Maintenance 4/10** — rests on undocumented platform internals |
| 24 | `hero-canvas-fx` | **61** | 36 | 25 | D | Narrow trigger; rarely fires |
| 25 | `autonomous-channel-plan` | **59** | 38 | 21 | **F** | Reuse 8/15 — single-purpose scoping doc |
| 26 | `ship-modern-3d-site` | **59** | 34 | 25 | **F** | **Maintenance 4/10** — pinned to a fast-moving stack |
| 27 | `personal-mentor-website` | **44** | 25 | 19 | **F** | Failure modes 5/15 — a recipe, not a record |

---

## The one B-band skill, and its two weaknesses

**`vishal-agarwal-site` — 89/100.** Perfect scores on failure-mode documentation (15/15),
actionability (12/12) and evidence (10/10). It is the most battle-tested document here.

Rule 4 of the rubric asks a top-band skill to publish its weaknesses. Both apply:

1. **It is 1,150 lines in a single file, with no `references/` split.** Progressive disclosure is
   missing entirely — a session loads all of it, including the bKash sandbox env inventory, to fix a
   CSS bug. This is the one thing that would move it into the A band.
2. **Maintenance risk 5/10.** Roughly a third of it is live state — cache-buster version numbers,
   per-area status tables, env inventories. It is dated, which helps, but it goes stale weekly and
   a stale line here is actively misleading rather than merely unhelpful.

---

## The three F-band skills — kept, with reasons

They are published rather than quietly dropped, because a library that only shows its best work is
not a library, it is a portfolio.

**`ship-modern-3d-site` — 59.** Content is fine; the problem is decay. Maintenance **4/10** because
it pins Next.js App Router + Tailwind v4 + react-three-fiber + drei + Framer Motion + Lenis, written
19 June 2026. The deploy-failure notes (401 protection, `framework:null` → 404, stray GitHub
auto-connect) are still the most valuable part and are stack-independent.
→ *Fix: split the durable deploy-failure material out into its own skill and let the stack recipe
carry a "verified against version X on date Y" header.*

**`autonomous-channel-plan` — 59.** Scores low on reuse (8/15) because it exists to scope exactly one
open request, and on maintenance (5/10) because it rests on current platform monetization policy and
API quota numbers. It is deliberately a *scoping* document that argues against part of the ask.
→ *Fix: if the project gets built, this becomes a project skill and is re-scored. If it is declined,
it should be archived rather than maintained.*

**`personal-mentor-website` — 44.** The weakest thing in the repo, and the gap is real: failure-mode
coverage **5/15** because it is a build recipe with no record of what went wrong, 0 code blocks, and
0 quoted trigger phrases. Its Bkash and booking sections are now superseded by
`bkash-payment-integration` and the consultation work in `vishal-agarwal-site`.
→ *Fix: either merge the still-unique part (the simple-vs-full stack fork) into another skill and
retire this one, or rewrite it against what was actually learned building the site twice.*

---

## Patterns worth acting on

**1. Trigger descriptions are the most common weakness.** Fourteen skills are flagged for having
fewer than three quoted user phrases, and eleven for having no negative scope. Both directly hurt
retrieval — a skill that does not contain the words the user will actually type is a skill that does
not load. **This is the cheapest fix in the repo and it improves real behaviour, not just the score.**

**2. Project skills under-score on actionability by construction.** `kianben-web` has zero code
blocks; `garmentmind` and `social-media-agent` have one each. They are architecture-and-decision
documents, which is correct for their job, but a few verification commands would make each of them
self-testing the way `vishal-agarwal-site` is.

**3. The best-scoring skills are the ones written from pain.** The top five all document specific
failures with the symptom stated first. The bottom three are recipes, plans, or scoping documents.
That correlation is the strongest argument in this repo for the
`session-to-project-skill` habit — *write the skill after something goes wrong, not before.*

**4. Maintenance risk is concentrated and known.** Five skills score ≤5 on maintenance
(`vercel-hobby-limits`, `bd-import-export-domain`, `public-data-without-api-keys`,
`ship-modern-3d-site`, `autonomous-channel-plan`, plus `vishal-agarwal-site` and
`social-media-agent`). Each names *why*. Those are the ones to re-check first in three months —
which is a maintenance schedule, not a criticism.

---

## What is deliberately not measured

- **Whether the advice is correct.** The rubric measures craft and leverage, not truth. Truth is
  established by `prove-before-claiming`, not by a score.
- **Popularity or usage frequency.** No telemetry exists, and inventing it would be exactly the kind
  of corruption this rubric is designed to prevent.
- **Third-party skills** (`impeccable`, `taste-skill`, the Vercel set, `caveman`, `ui-ux-pro-max`).
  They are listed in `skills/manifest.json` with install commands. Scoring someone else's work
  against a rubric built for this library would not be meaningful.

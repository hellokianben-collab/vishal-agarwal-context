# Skill rubric

A score you cannot recompute is an opinion wearing a number's clothes. So 60 of the 100 points here
are **computed by a script you can run**, and the other 40 require a **written justification naming
specific content** — the scorer refuses an entry without one.

```bash
node tools/score-skills.mjs            # the table
node tools/score-skills.mjs --json     # per-dimension detail and every flag
```

---

## Design constraints — the anti-inflation rules

These exist because it is very easy to write a rubric that makes everything look excellent.

1. **The machine half is mechanical.** No judgement. Same input, same number, on anyone's machine.
2. **Every human sub-score carries a justification** that names a specific section, quote or
   mechanism. `ratings/human-scores.json` is refused by the scorer if a justification is under 15
   characters. Vague praise cannot be entered as a score.
3. **The bands are hard.** 90+ means exceptional. A skill that "works fine" lands in the 60s. If most
   things score in the 80s, the rubric is broken, not the library.
4. **Any skill scoring ≥90 must publish at least two concrete weaknesses** in the scorecard.
   *As of 13 Aug 2026 nothing scored 90+ — the ceiling reached is 89.*
5. **Every skill publishes its weaknesses regardless of score.** The scorecard's flag column comes
   straight from the scorer; it is not curated.
6. **Low scores stay low.** Three skills are in the F band. They were not quietly deleted, softened,
   or excused — the entry says what is wrong and what would fix it.

## The 60 machine points

| # | Dimension | Pts | What is measured |
|---|---|---|---|
| 1 | **Trigger quality** | 12 | Frontmatter present · description 200–2000 chars · an explicit "use when/whenever" clause · **≥3 quoted user phrases** · a boundary or negative scope |
| 2 | **Actionability** | 12 | Fenced code blocks · runnable command lines · concrete file paths · numbered steps and checklists |
| 3 | **Evidence & specificity** | 10 | Verbatim error strings · dates · measured quantities · symptom→cause reasoning |
| 4 | **Structure** | 8 | Valid frontmatter · `name` matches directory · ≥4 H2 sections · ≤500 lines **or** a `references/` split |
| 5 | **Portability** | 10 | Scored **against declared type**: a `portable` skill loses points for absolute machine paths, a `project` skill loses points for *not* pinning locations · a stack/identity table · cross-references |
| 6 | **Safety hygiene** | 8 | **Zero secret-shaped strings** (8 credential patterns) · explicit prohibitions |

Dimension 6 is the only one that can fail catastrophically: any secret-shaped string costs 5 of 8
points immediately and prints a `!!` warning at the bottom of the table.

### Known biases in the machine half — stated, not hidden

- **Domain and strategy skills score lower on Actionability** than operational ones, because they
  legitimately contain fewer shell commands. `bd-import-export-domain` and `ruthless-venture-review`
  are penalised for being knowledge rather than procedure. That is a limitation of the proxy, and it
  is what the human half exists to correct.
- **Undated skills lose Evidence points** even when the content is timeless. This is deliberate — an
  undated claim hides its own decay risk — but it is harsh on pure-principle skills.
- **A long skill is not necessarily a bad one.** The 500-line rule is satisfied by splitting into
  `references/`, not by deleting content.

## The 40 human points

| Dimension | Pts | The question |
|---|---|---|
| **Failure-mode coverage** | 15 | Does it document what goes wrong, with the symptom you would actually observe **first**? |
| **Reuse leverage** | 15 | How much time does it save, on how many future tasks? |
| **Maintenance risk** *(inverted)* | 10 | 10 = principles that won't age. 0 = wrong within months. |

Guidance used when scoring:

- **Failure modes** — 13–15: multiple real failures with exact signatures and diagnoses. 9–12:
  several real failures. 5–8: some warnings. 0–4: happy path only.
- **Reuse leverage** — 13–15: saves hours across many future tasks and projects. 9–12: a recurring
  class of task. 5–8: narrow but real. 0–4: effectively one-off.
- **Maintenance** — 9–10: nothing version-bound. 6–8: mostly stable, some vendor detail. 3–5: rests
  on a vendor's current behaviour. 0–2: will be wrong within months.

Note that **maintenance risk is scored honestly against the skill's own content**, which means the
most useful skills often score *lower* here — `vercel-hobby-limits` is composed almost entirely of
one vendor's current numbers, and gets a 5 for it. That is the correct answer, not a criticism of
whether to have written it.

## Bands

| Total | Band | Meaning |
|---|---|---|
| 90–100 | **A — exceptional** | Rare. Must also publish two weaknesses. |
| 80–89 | **B — strong** | Battle-tested, would hand to someone else unchanged. |
| 70–79 | **C — solid** | Does its job; a specific dimension is visibly weaker. |
| 60–69 | **D — usable, gaps** | Real value, real holes. Named in the scorecard. |
| < 60 | **F — needs work** | Keep only with a stated reason and a fix path. |

## How to challenge a score

Every number has a mechanism behind it.

- **Machine half:** run `node tools/score-skills.mjs --json` and read the `notes` array for that
  dimension. It says exactly what it counted and what it did not find.
- **Human half:** open `ratings/human-scores.json` and read the `why`. Argue with the justification,
  not the number.
- **The rubric itself:** if a dimension is measuring the wrong thing, change it here and re-run.
  Every score moves together, which is the point.

---

*Rubric v1, 13 August 2026. Scored: 27 skills, mean total **69.3/100**, range **44–89**.*

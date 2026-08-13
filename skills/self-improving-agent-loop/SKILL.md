---
name: self-improving-agent-loop
description: >-
  Architect a long-running agent system that measurably gets better instead of accumulating
  confident guesses — specialist micro-agents woken by events, a shared playbook, observed (not
  self-reported) outcomes as the training signal, and a critic that deletes unsupported claims. Use
  when building any autonomous or scheduled agent, a multi-agent system, a monitoring/growth agent, a
  "learns from feedback" feature, or when an existing agent's advice has drifted into plausible
  nonsense. Also use when deciding between one generalist agent and several specialists. Carries the
  attribution mechanism, the honesty mechanism, and the control-plane pattern that avoids exposing a
  laptop to the internet.
---

# Building an agent loop that actually improves

Distilled from a working system that monitors three social platforms, proposes changes, and grades
its own past advice against measured outcomes.

**The default failure mode of every long-running agent:** it produces advice, nobody records whether
the advice worked, the knowledge base fills with plausible claims, and within a month every
recommendation is confidently wrong. Everything below is defence against that.

---

## 1. Specialists that sleep, not one generalist

One agent per job. Each is **woken only by the event it owns** and does nothing the rest of the time.

| Agent | Woken by | Owns |
|---|---|---|
| Design | an asset needs judging/replacing | the visual artifact, scored against the account's own baseline |
| Copy | the words are the problem | titles, hooks, first 15 seconds |
| Analyst | daily | one briefing: what changed, why, **one** instruction |
| Platform (per surface) | that surface's metrics move | platform-specific behaviour |
| Strategy | weekly, or on a trigger | what to make next |
| Critic | weekly | grading the others, deleting unsupported claims |

Why specialists win here:

- **Cost.** Every agent's context is paid for on every run. A generalist that reads everything is
  expensive *and* vague.
- **Scoring.** A narrow agent can be scored on a specific measured number. A generalist cannot.
- **Currency.** Each specialist can have its own small research beat keeping it up to date, without
  polluting the others.

Give each one an explicit **"you are scored on X"** line in its prompt, where X is a real measured
metric. Not "be helpful".

## 2. One briefing, one instruction

The daily agent's brief is worth copying verbatim in spirit:

> *"You write one short briefing each morning: what changed, why, and the single most valuable thing
> to do today… **Never describe — always diagnose.** You are scored on whether your predictions came
> true. Every one is stored and checked automatically."*

A dashboard read aloud is not a briefing. **Diagnosis + one action.** Busy owners execute one thing.

## 3. Observed outcomes, not self-reported ones — the core idea

This is what makes the loop close:

> *"it watches whether you took its advice, **without you telling it**. Perceptual hash on
> thumbnails, string diff on titles. You swap a thumbnail → it notices, links it to the advice that
> suggested it, snapshots 7 days before/after, writes verdict: worked / no effect / backfired.
> **That verdict is the training signal.**"*

The general pattern:

```
1. advice is issued          → stored with an id, a timestamp, and a predicted direction
2. the world is polled       → cheap fingerprints of the mutable artifacts (hash, diff, checksum)
3. a change is detected      → attributed to the most recent relevant advice
4. a window is measured      → N days before vs N days after
5. a verdict is written      → worked / no effect / backfired
6. verdicts feed the playbook
```

**Never ask the human whether they took the advice.** They will not answer, and if they do, they will
misremember. Detect it.

**Store the prediction before the outcome exists.** A prediction written after the fact is not a
prediction, and a system that lets itself do that will always look accurate.

The record shape that makes this auditable — write it when the advice is issued, never later:

```json
{
  "id": "adv_0142",
  "issued_at": "2026-08-02T06:00:00+06:00",
  "agent": "design",
  "target": { "kind": "video", "id": "abc123XYZ01" },
  "artifact_fingerprint": "phash:f0e1a2b3c4d5e6f7",
  "advice": "replace thumbnail: single face, left third, 4-word overlay",
  "predicted": { "metric": "ctr_7d", "direction": "up", "baseline": 0.041 },
  "adopted_at": null,
  "measured": null,
  "verdict": null
}
```

Detection and grading, on a schedule:

```bash
# 1. cheap fingerprints of the mutable artifacts
python -c "import imagehash,PIL.Image as I; print(imagehash.phash(I.open('thumb.jpg')))"

# 2. fingerprint changed AND an open advice targets it → set adopted_at
# 3. +7 days → pull ctr_7d, compare to baseline, write verdict
#      worked | no effect | backfired
```

Two rules that keep the signal honest:

- **Attribute to the most recent open advice for that target, or to nothing at all.** If two pieces
  of advice could explain the change, record `verdict: ambiguous` — do not pick the flattering one.
- **A change you cannot detect is not a success you can claim.** No fingerprint delta, no verdict.

## 4. The critic — mandatory, not optional

> *"Every other agent has an incentive to sound useful. Over time that turns a knowledge base into
> [confident guesses]… **Be hard on yourself. A playbook full of flattering guesses is worse than an
> empty one, because it makes every future piece of advice confidently wrong.**"*

The critic runs on a schedule and has exactly one power the others lack: **deletion**.

Its brief:

- Score each agent against **what actually happened**, not against how reasonable it sounded.
- **Delete every claim the evidence does not support.** Not soften — delete.
- Say plainly where the system was wrong.
- Report its own limitations.

Without a critic, the playbook only grows. A knowledge base that can only grow is a knowledge base
that is only getting more wrong.

## 5. Two-file memory: playbook vs learned

- **`playbook.md`** — durable operating rules that have survived criticism. Small. Curated.
- **`learned.md`** — recent observations and verdicts, not yet promoted. Churny.

Promotion from `learned` → `playbook` is the critic's job. Demotion and deletion too. Keeping them in
one file means nothing ever gets removed.

## 6. Control plane — never expose the laptop

The agent runs locally; the dashboard is public. Connecting them by opening a port or a tunnel is the
obvious answer and the wrong one.

**Use a queue the agent polls:**

```
web dashboard  ──writes command──▶  private blob store
                                          │
local agent (scheduled, every 15 min) ────┘
   pulls with a token → applies → acknowledges → republishes state
```

Refinements that matter:

- **Put the whole command in the blob *pathname***, so `list()` reads the queue without downloading
  anything.
- The published dashboard is **read-only**; all mutation goes through the queue.
- A chat channel (Telegram `/fix <n>`, `/skip <n>`) is the same queue with a different front end —
  build the queue first, then the front ends are trivial.
- **Acknowledgement must actually delete the item.** A silent ack failure means every sync re-runs
  the same work forever. This has already happened once, caused by a body-parsing bug — the platform
  pre-parsed JSON into an object and a generic raw-body helper re-encoded it as form data and then
  failed to parse it. Check `typeof body === 'object'` first.

## 7. Scheduling

- Windows: **Task Scheduler**, not cron.
- Idempotent runs — a double-fire must not double-post.
- Log every run's outcome somewhere the owner can see. A silent agent is indistinguishable from a
  dead one.
- **Google OAuth apps left in "Testing" lose their refresh token every 7 days.** Publish to "In
  production" or the agent dies silently once a week.
- **Platform metric names change constantly.** Never hardcode them — request a deliberately invalid
  metric and parse the valid list out of the platform's own error response.

## 8. What to tell the owner

- Exactly what it will do without asking, and what it will always ask about.
- Whether the computer needs to be on (for a local agent: **yes**, and say so before they discover
  it).
- How to stop it.
- Where to see what it did.

## Anti-patterns

| Don't | Because |
|---|---|
| One agent that does everything | expensive, vague, unscoreable |
| Ask the human if the advice worked | they won't answer, and misremember when they do |
| Append-only knowledge base | drifts into confident nonsense |
| Score on sounding useful | that is the thing that goes wrong |
| Expose the local agent over a tunnel | unnecessary attack surface for a 15-minute poll |
| Report progress only on success | a silent failure looks identical to nothing happening |

## Checklist before letting an agent run unattended

- [ ] Every agent's prompt names the measured number it is scored on
- [ ] Predictions are written **before** outcomes exist, with a timestamp
- [ ] Adoption is **detected**, never self-reported
- [ ] Ambiguous attribution is recorded as ambiguous, not resolved favourably
- [ ] A critic runs on a schedule and can **delete**
- [ ] Runs are idempotent — a double-fire cannot double-post
- [ ] Every run writes an outcome line the owner can read
- [ ] Control is a polled queue, not an inbound port
- [ ] Acknowledgement provably removes the item (test a replay)
- [ ] The owner has been told the machine must be on

*Architecture built 2–5 August 2026 and running on schedule since; re-checked 13 August 2026.*

## Related

- `windows-agent-automation` — scheduling and shell traps
- `work-within-usage-limits` — agent fan-outs die on limits and return misleading zeros

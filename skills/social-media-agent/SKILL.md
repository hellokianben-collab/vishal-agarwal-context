---
name: social-media-agent
description: Project context and working guide for Vishal's AI social media manager — a local Python agent in Desktop/claude/socialagent that monitors YouTube, Facebook and Instagram, diagnoses why performance dropped, designs replacement thumbnails, rewrites titles, learns from what he approves, and publishes a password-gated dashboard to socialagent-dashboard.vercel.app. Load this whenever the user mentions the social agent, "my channel", "the YouTube agent", thumbnails or CTR dropping, Facebook/Instagram engagement or reach, the channels/monitoring list, the micro-agents (design, copy, analyst, meta, strategy, critic), the manager, playbook.md or learned.md, "Fix it now"/"Don't need it", autopilot, the Telegram /fix and /skip commands, run_daily/run_sync/run_weekly, the Vercel dashboard or its password, or anything inside the socialagent folder. Use it even for vague asks like "check my channel", "why are my views down", "the agent isn't running", "add a channel to monitor", "redeploy the dashboard", or "keep building the social agent" — it carries the architecture, the design rules that must not regress, and the expensive traps that already cost hours once.
---

# Social Media Agent

An AI social media manager that runs on Vishal's own laptop for **$0/month**.
It watches YouTube, Facebook and Instagram, tells him what is going wrong and
*why*, prepares the fix, and gets better at his specific channels over time.

**Location:** `C:\Users\Susanta Podder\Desktop\claude\socialagent`
**Live dashboard:** https://socialagent-dashboard.vercel.app (password-gated)
**In-repo docs:** `README.md` (overview), `SETUP.md` (click-by-click setup),
`LEARN.md` (why it is built this way — written for a non-coder learning agents)

## Who you are working with

Vishal has **no coding background and does not want to write code**. He clicks
through consent screens and pastes secrets; everything else is yours. When you
give him steps, write them click-by-click, with the exact command in a fenced
`bash` block. Never hand him a code snippet to "just add".

He also wanted to *learn* as this got built — that is what `LEARN.md` is for.
When you do something architecturally interesting, explain the why briefly.

## Current state

| Piece | State |
|---|---|
| YouTube collectors, rules, agents | built, verified on synthetic data |
| Facebook + Instagram | built, verified on synthetic data — **never yet run against a real Meta token** |
| Manager + 6 micro-agents | built, working |
| Fix it now / Don't need it, preference learning, autopilot | built, working |
| Unified dashboard + channels list | built, working |
| Vercel published dashboard + command queue | deployed, round-trip verified |
| Demo data | **cleared** — database is empty, awaiting real accounts |
| Google OAuth / Meta token | **not done yet** — no `client_secret.json`, no `token.json` |
| YouTube write access (apply changes directly) | built but deliberately switched off |

So the most likely next thing he needs is help finishing the real setup
(`SETUP.md` parts 2 and 6), or debugging the first real run.

## Design rules that must not regress

These were his explicit decisions. Breaking one is a real regression, not a
refactor.

1. **Detection stays purely statistical.** `analyze/rules.py` must never import
   `memory/preferences.py`. There is an assertion in `preferences.py` that
   reads the file and fails if it does — run `python -m memory.preferences` to
   check. Taste decides only what runs *unattended*, never what he is *shown*.
   If preference learning fed detection, the agent would hide problems it
   predicted he would ignore, he would stop fixing them, and that would
   "confirm" the guess. It would go blind in one eye.

2. **Nothing touches his live channels.** The agent prepares work; he pastes
   it. `capabilities.youtube_write` is off, and turning it on needs a second
   deliberate step (re-auth with write scope AND the config flag).

3. **Python decides what is true, the AI decides what it means.** No language
   model does arithmetic anywhere in this system. `analyze/` computes; `brain/`
   interprets numbers that are already correct.

4. **Each micro-agent owns its own `learned.md`.** It rewrites that file
   itself. The manager and the critic may only *propose* changes, which queue
   in `pending_edits` for his approval on `/agents`.

5. **Agents must tag claims** `[measured, n=N]` or `[observed, unverified]`.
   They over-claimed "Confirmed" from single snapshots until this was enforced
   in every prompt. Never let a claim be called proven without a measured
   before/after.

6. **Reach falling while engagement rate holds is Meta throttling, not his
   failure.** The `meta` agent says so and moves on to something actionable.
   Do not let it invent a content problem there.

7. **Buttons must do something.** A control that cannot work should not be
   rendered. This is why the published dashboard grew a real command queue
   instead of fake buttons, and why blocked fixes say which capability is
   missing.

## The expensive traps

Each of these cost real time once. They are not hypothetical.

**`claude` and `vercel` are `.cmd` shims on Windows.** Passing a multi-line
prompt as an argv element gets it truncated at the first newline by cmd.exe —
the model then answers a question it never received, and the symptom looks like
"the AI is being stupid". Pipe prompts through **stdin**. And `subprocess`
cannot resolve the bare name at all: always use the full path from
`shutil.which(...)`. Both bit this project.

**Google OAuth apps left in "Testing" lose their refresh token every 7 days.**
The app must be published to "In production" or the agent dies silently every
Saturday with an error that explains nothing. `core/google_auth.py` catches
that specific failure and prints the actual fix.

**Meta renames its insight metrics constantly** — the whole `impressions`
family retired through 2025–26. Never hardcode them. `core/meta_auth.py`
requests a deliberately invalid metric and parses the valid list out of Meta's
own error message, then caches it for a week.

**Pillow here has no raqm** (`features.check('raqm') == False`), so it cannot
shape Bengali — Bangla renders as disconnected broken glyphs. The design agent
supplies a Latin transliteration (`big_text_latin`) for draft images and tells
him the real Bangla text to use.

**Piping a value into `vercel env add` appends a newline**, which silently
breaks every password comparison. `site/api/index.js` trims env vars on read.

**Vercel pre-parses JSON request bodies into an object.** A generic
read-the-raw-body helper re-encodes that as form data and then fails to parse —
which silently left acknowledged queue items in place, so every sync re-ran the
same work. Use `readJson()`, which checks `typeof req.body === 'object'` first.

**`@vercel/blob` below v2 cannot write to a private Blob store** — it rejects
`access:'private'` client-side before ever contacting the store. Pinned to
`^2.6.1`.

**Vercel free plan caps a project at 12 serverless functions.** The whole site
is one `api/index.js` router with rewrites.

## Architecture in one paragraph

A **manager** (`brain/manager.py`) owns all the data and wakes six dormant
specialists, handing each only the data slice it declared in
`brain/registry.py` — enforced in code, so an agent literally cannot receive
data outside its scope. Shared blocks are computed once per run and reused,
which is why six agents cost less than one big one. Detection
(`analyze/rules.py`, `analyze/meta_rules.py`) is pure arithmetic against his
own trailing-30-day medians, age-matched and platform-matched. `memory/`
notices when he acts on advice (perceptual hash on thumbnails, string diff on
titles), measures the result 7 days later, and writes a verdict.

For the full file map, data model, agent roster and block system, read
`references/architecture.md`.
For the Vercel site, the command queue and its secrets, read
`references/deploy.md`.

## Common tasks

Every command runs from the project folder with its own venv:

```bash
cd "C:\Users\Susanta Podder\Desktop\claude\socialagent"
```

Then prefix with `.\.venv\Scripts\python.exe`.

| He says | Do this |
|---|---|
| "check my channel" / "what's wrong" | `-m analyze.rules --dry-run` then `-m analyze.meta_rules` |
| "the agent isn't running" | read `data\logs\agent.log` first, always |
| "is it scheduled?" | `-m setup.install_schedule --list` |
| "add a channel to monitor" | the `/accounts` page, or `-m core.accounts` to list |
| "redeploy the dashboard" | `-m publish.snapshot --deploy` |
| "I pressed something on the website" | `run_sync.py` forces it instead of waiting 15 min |
| "review this thumbnail" | `-m brain.brain --thumbnail VIDEO_ID` |
| "what do the agents know?" | `-m brain.brain --agents`, or the `/agents` page |
| "did its advice work?" | the `/learning` page, or `-m memory.track` |
| "it drew a wrong conclusion" | `-m memory.track --override ID worked "reason"` |

Full command list is at the bottom of `SETUP.md`.

## When changing things

- **Prompts and agent identity** live in `agents/<name>/context.md` and
  `prompt.md`. They are plain English and are the highest-leverage thing to
  edit. If advice is not specific enough, say so there.
- **What data an agent may see** is `allowed_inputs` in `brain/registry.py`.
  Adding a placeholder to a prompt without adding it there means the manager
  withholds it and logs a warning — that is working as designed.
- **Thresholds** are ratios in `config.yaml`. The agent may tune them itself
  within bounds it cannot exceed; changes are logged to `data\logs\tuning.log`.
- **A new platform** is new files in `collect/`, new rules, and a row in
  `accounts`. `metrics_daily` is long-format precisely so this needs no
  migration.
- After any change, run `python -m compileall -q core collect analyze brain
  memory notify dashboard setup tasks publish` and
  `python -m memory.preferences` (the isolation guard).

## Verifying, not assuming

This project has a habit worth keeping: every claim in this repo was checked
before it was written down. The rules engine was run against seeded data
shaped to trigger each rule. The web command queue was tested with a real
round trip — flag created, button pressed on the live site, command pulled by
the laptop, decision recorded, queue emptied. Two genuine bugs surfaced that
way that would otherwise have shipped silently.

Keep doing that. When you finish something here, prove it works and show the
output, rather than describing what should happen.

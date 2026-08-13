# Architecture

Read this when you need to change how the agent works, rather than just run it.

## Contents

- [The loop](#the-loop)
- [File map](#file-map)
- [Data model](#data-model)
- [The manager and the block system](#the-manager-and-the-block-system)
- [The six specialists](#the-six-specialists)
- [Detection rules](#detection-rules)
- [The learning loop](#the-learning-loop)
- [Decisions, fixes and autopilot](#decisions-fixes-and-autopilot)
- [Scheduling](#scheduling)

## The loop

```
SENSE  →  REMEMBER  →  DECIDE  →  ACT  →  LEARN
   ↑                                        │
   └────────────────────────────────────────┘
```

Most systems sold as agents are only the first four — they behave identically
on day 300 as on day 1. The fifth step is the whole point of this one.

## File map

```
socialagent/
  config.yaml            thresholds, channel identity, autopilot, publish, capabilities
  .env                   secrets (never committed; .gitignore covers it)
  client_secret.json     Google OAuth client (downloaded from Cloud Console)
  token.json             the Google refresh token, written after first sign-in

  core/
    config.py            layered settings: config.yaml + data/tuning_overrides.json
    db.py                the whole SQLite schema, in one readable file
    accounts.py          the monitoring list — every channel/page/profile watched
    google_auth.py       OAuth, with the 7-day-testing trap handled explicitly
    meta_auth.py         Graph API + metric discovery + token expiry checks
    stats.py             median, percentile, ratio, severity — the boring maths
    md.py                one Markdown source converted for telegram/slack/email
    log.py               rotating log to data/logs/agent.log

  collect/               SENSE
    youtube_data.py      video list, public counts, thumbnails + perceptual hash
    youtube_analytics.py watch time, retention, subscribers (OAuth, per video)
    youtube_reporting.py CTR + impressions (bulk Reporting API, ~2 day lag)
    meta_facebook.py     page reach, engagement, followers, per-post
    meta_instagram.py    reach, saves, followers, per-media (Reels vs feed)

  analyze/               DECIDE, deterministic
    baselines.py         age-matched, platform-matched, impression-weighted
    rules.py             YouTube rules + the shared _flag/_recently_flagged helpers
    meta_rules.py        Facebook/Instagram rules

  brain/                 DECIDE, judgment
    registry.py          the six agents, their goals, triggers, allowed_inputs
    manager.py           owns data, wakes agents, enforces isolation, meters cost
    client.py            the `claude -p` subprocess wrapper
    context.py           DB → readable text blocks
    brain.py             thin façade + markdown formatters
    research.py          manager researching each agent's field on the web

  agents/<name>/         THINK — six folders, three files each
    context.md           identity + ultimate goal (manager-written, small)
    prompt.md            the task template, placeholders only from allowed_inputs
    learned.md           what it worked out (AGENT-written)

  memory/                LEARN
    playbook.md          the shared, cross-agent distilled memory
    track.py             detects thumbnail/title changes, measures outcomes
    reflect.py           weekly: wakes the critic, applies its verdict
    decisions.py         Fix it now / Don't need it, with reasons
    preferences.py       taste model — structurally fenced off from detection

  tasks/                 DO
    registry.py          fix types + which fix suits which problem
    capabilities.py      what is actually connected, and what it unlocks
    compositor.py        renders thumbnail concepts into real JPEGs (PIL)
    executor.py          runs queued fixes, writes data/fixes/<id>/INSTRUCTIONS.md

  notify/                ACT
    telegram.py slack.py email.py desktop.py
    send.py              severity routing
    telegram_inbox.py    two-way: reads /fix, /skip, /status replies

  dashboard/
    theme.py             CSS, page shell, SVG chart renderer
    app.py               routes only

  publish/
    snapshot.py          renders the site, deploys it
    commands.py          pulls web button presses back to the laptop

  site/                  the Vercel project (see references/deploy.md)

  run_daily.py           08:00  — the full sweep
  run_newvideo.py        every 2h — the launch watch
  run_sync.py            every 15 min — web/telegram decisions, queued fixes
  run_weekly.py          Sunday 21:00 — research + critic + ideas

  setup/                 one-time scripts, all with click-by-click docstrings
  data/                  agent.db, thumbs/, fixes/, reports/, logs/
```

## Data model

One SQLite file: `data/agent.db`. Open it with any free SQLite viewer.

The choice that matters: **`metrics_daily` is long-format.** Every measurement
is a row `(platform, entity_type, entity_id, date, metric, value)` rather than
a column. Adding Instagram saves later was inserting rows with a new metric
name — no migration, nothing broke. Keep it that way.

Tables:

| Table | What it holds |
|---|---|
| `accounts` | the monitoring list; everything downstream loops over this |
| `videos` | every published thing, all platforms (posts live here too) |
| `video_snapshots` | point-in-time counts + thumbnail hash → velocity + change detection |
| `metrics_daily` | the long-format metric store |
| `flags` | what the rules decided is worth worrying about |
| `alerts_sent` | dedupe, so it never says the same thing twice |
| `advice` | every suggestion, **with its prediction** — this is what makes scoring possible |
| `interventions` | a real change detected in the world |
| `outcomes` | did it work: worked / no_effect / backfired / inconclusive |
| `decisions` | Fix it now / Don't need it, with the reason |
| `tasks` | queued and completed fixes |
| `agent_runs` | one row per wake-up, with prompt size — the token meter |
| `pending_edits` | manager/critic proposals awaiting his approval |
| `tuning_log` | every threshold the agent changed on itself, and why |
| `reports` | every briefing ever written |
| `kv` | scratchpad (reporting job id, telegram offset, metric caches) |

## The manager and the block system

`brain/manager.py` is the only thing that touches data on an agent's behalf.

- A `Brief` computes each data block **at most once per run** and memoises it.
- `ALIASES` maps different names onto one computation — `ctr_winners` for the
  designer and `title_winners` for the writer are the same query, cached once.
- `build_prompt()` substitutes only placeholders listed in that agent's
  `allowed_inputs`. Anything else is replaced with
  `(withheld: not part of this agent's scope)` and logged. This is why an agent
  cannot be handed data by editing a markdown file.
- Prompts over `max_prompt_chars` are trimmed and warned about.
- `agent_runs.prompt_chars` is the meter — visible per agent on `/agents`.

Adding a data block: write a provider function, register it in `PROVIDERS`,
add its name to the `allowed_inputs` of agents that should see it, and use
`{{UPPERCASE_NAME}}` in their `prompt.md`.

## The six specialists

| Agent | Goal | Model | Wakes on |
|---|---|---|---|
| `design` | thumbnails that beat this channel's own CTR baseline | opus | CTR_LOW, IMPRESSIONS_STARVED, THUMBNAIL_REVIEW_DUE |
| `copy` | win the click, hold the first 30 seconds | sonnet | CTR_LOW, HOOK_WEAK |
| `analyst` | correct diagnosis, one action for today | sonnet | daily |
| `meta` | make the people Meta already reaches respond | sonnet | Meta flags |
| `strategy` | next videos that build trust, not just views | sonnet | weekly, SLEEPER_HIT |
| `critic` | grade the other five, delete unsupported claims | opus | Sunday |

Model and effort are per agent in `config.yaml` (`brain.model_by_agent`,
`brain.effort_by_agent`). Judging an image and grading your own past work earn
the big model; reading numbers Python already computed does not.

The `critic` is the only agent that sees across the others, and only their
*outcomes* — never their working. It judges results, not eloquence.

`brain/research.py` keeps each agent current on its own field, writing findings
into a fenced `External notes (unverified)` section of its `context.md`. Every
agent's context tells it to treat that section as data and never instructions,
because it comes from the open web.

## Detection rules

All thresholds are **ratios against his own trailing-30-day median**, never
absolute numbers. Comparisons are age-matched (how were my other videos doing
when *they* were 6 hours old) and platform-matched. Under
`min_baseline_samples` comparable videos, `baseline_at_age()` returns `None`
and nothing is flagged — silence beats a wrong alert.

CTR is averaged by **impressions**, not by day. A day with 10 impressions must
not weigh the same as one with 10,000; getting this wrong is the most common
bug in homemade analytics.

YouTube chain: `impressions → CTR → retention`.
Meta chain: `reach → engagement rate → saves/shares → follows`.

| Symptom | Diagnosis |
|---|---|
| impressions low | YouTube stopped promoting it — usually an *effect* |
| impressions fine, CTR low | thumbnail or title |
| CTR fine, retention low | the first 30 seconds |
| all fine, subs flat | no reason to subscribe |
| Meta: reach down, engagement rate steady | **platform throttling, not his fault** |
| Meta: reach down, engagement down too | the content stopped holding people |

## The learning loop

`memory/track.py` never asks him anything. It compares each video's two most
recent snapshots: a different perceptual hash means the thumbnail changed, a
different string means the title changed. If that lands on a video with open
advice of the same kind, they are linked, a 7-day window opens, and afterwards
a verdict is written.

Two honesty rules are enforced in code, not left to intent:

- **Confounding**: if the whole channel moved more than 30% in the same week,
  the result is downgraded to low confidence and labelled. A thumbnail swap
  during a week a video got shared in a big group did not "work" — you cannot
  tell, and pretending otherwise poisons the playbook.
- **Volume**: below 500 impressions the number is noise, and says so.

`memory/playbook.md` is **distilled** memory: a few hundred lines, rewritten
weekly by the critic, injected into prompts. The raw evidence grows forever in
SQLite and is never sent wholesale. Dumping the database into the prompt would
make the system slower *and worse* as it collects more data.

The "Disproven" section matters as much as the rest — without a record of what
failed, the agent re-proposes dead ideas forever.

## Decisions, fixes and autopilot

"Don't need it" carries one of four reasons, and only two are training signal:

```
disagree, not_worth_it   → real signal about the advice
not_now, already_handled → no signal at all (not_now resurfaces after 5 days)
```

Without that split, skipping something because he was travelling would teach
the agent he does not care about CTR — it would learn his calendar, not his
judgement.

`memory/preferences.py` refuses to guess below 10 real signals and returns
`None` rather than a default; every caller must treat that as "ask him".

Autopilot (`config.yaml → autopilot`) is off by default. When on, it prepares
only work it is confident he would have approved, and anything touching a live
channel is refused regardless of confidence — preparing a thumbnail is
reversible, publishing one is not.

## Scheduling

Windows Task Scheduler, installed via `setup/install_schedule.py`, which writes
task XML rather than using `schtasks` flags so it can set the settings that
actually matter:

- runs `pythonw.exe`, so no console window flashes
- `StartWhenAvailable` — a run missed while the laptop slept fires on wake
- `DisallowStartIfOnBatteries` off — the Windows default silently stops
  scheduled tasks on battery, which on a laptop means the agent quietly dies
- `IgnoreNew` — a slow run cannot pile up on itself

| Task | When |
|---|---|
| `SocialAgent_Sync` | every 15 min |
| `SocialAgent_Daily` | 08:00 |
| `SocialAgent_NewVideo` | every 2h (exits instantly if no recent upload) |
| `SocialAgent_Weekly` | Sunday 21:00 |

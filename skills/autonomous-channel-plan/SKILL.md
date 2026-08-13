---
name: autonomous-channel-plan
description: >-
  Honest architecture and feasibility read for an agent that creates and runs a content channel on
  its own — picks a niche, produces and schedules daily video, and grows an audience. Use when asked
  to build a fully autonomous YouTube/TikTok/Shorts channel agent, "grow a channel to 1M
  subscribers", an AI faceless-channel pipeline, or daily automated content generation. Carries the
  pipeline that is actually buildable, the platform policy constraints that decide whether it
  survives, what "free tools only" really costs, and why the subscriber target is a goal rather than
  a plan. Use it to scope the ask truthfully before building.
---

# Autonomous content channel — what is real and what is not

Written in response to a specific ask (12 Aug 2026):

> *"create an agent that will create a youtube channel, then constantly create content on it's own on
> a specific topic (the topic is to be selected by the agent), schedule the posts 1 video each day
> (Duration 10+), for that find and use free ai tools available in the internet without spending any
> money, ultimately growing that channel to a 1 million subscribers as soon as possible."*

**The honest headline: the pipeline is buildable. The 1M target is a goal, not a plan, and no
architecture can promise it.** Say that first, then build the thing that is real.

---

## What can actually be automated end to end

```
niche selection  →  topic queue  →  script  →  voice  →  visuals  →  assembly
                                                                        ↓
              performance feedback  ←  upload + schedule  ←  thumbnail + title
```

Every arrow is automatable today. The pipeline is not the hard part.

| Stage | Approach | Free tier reality |
|---|---|---|
| Niche + topic | LLM over search-demand signals + competitor gaps | yes |
| Script (10+ min ≈ 1,400–1,800 words) | LLM with a fixed structural template | yes |
| Voice | local TTS (Piper, XTTS) | **yes, genuinely free, runs on the box** |
| Visuals | stock footage + Ken Burns over stills + generated B-roll | mostly |
| Assembly | **ffmpeg** or a Remotion-style composer | yes, and this is the reliable part |
| Thumbnail | template + generated hero image | mostly |
| Upload + schedule | **YouTube Data API v3** | yes — 10,000 quota units/day, an upload costs ~1,600 |
| Feedback | YouTube Analytics API | yes |

**Quota note:** ~1,600 units per upload against a 10,000/day default means ~6 uploads/day maximum.
One per day is comfortably inside it. Do not design for more without requesting a quota increase.

`OpenMontage` is already cloned on this machine and sits directly upstream of the assembly stage.

## What "free tools only" actually costs

The constraint is real but it moves the cost rather than removing it:

- **Compute is yours.** Local TTS and video encoding run on the laptop. A 10-minute video is roughly
  10–30 minutes of encoding depending on the composition. Daily is fine; the machine must be **on**.
- **Free tiers rate-limit and change.** A pipeline built on five free web services is a pipeline with
  five silent breakage points. Prefer **local + official API** over free-tier SaaS wherever there is
  a choice — it is the difference between a system and a house of cards.
- **Free stock footage has licence conditions.** Attribution and no-resale terms are real. Track the
  source of every clip or the channel is a copyright strike waiting to happen.
- **Quality is the actual price.** Free TTS and stock-footage montage produce competent, generic
  video. That is the category the platform is currently most hostile to (see below).

## The constraints that decide whether it survives

These are not engineering problems and they cannot be engineered around.

1. **Platform policy on mass-produced content.** YouTube monetization policy targets "inauthentic"
   and mass-produced content directly. A channel of 100% templated AI narration over stock footage is
   the archetype of what gets demonetized or removed. **Design for a differentiator that is not
   automatable** — a real data source, a genuine domain (his import/export expertise is one), a real
   voice.
2. **One video per day is a volume strategy, and volume strategies are the ones being penalized.**
   Fewer, better, with a real informational edge, is both safer and more likely to work.
3. **Account standing is a single point of failure.** One channel, one Google account, one strike
   policy. Do not build anything the owner would be sad to lose.
4. **"As soon as possible" to 1M is outside the system's control.** It depends on niche, luck, and
   distribution. Anyone promising a timeline is guessing.

## Therefore — the honest recommendation

**Do not build a topic-agnostic content farm.** Build the same pipeline pointed at a real edge:

- The niche is **not** chosen by the agent from scratch. It is **Bangladesh import/export**, where the
  owner has four years of real operating experience, a book, an existing audience, and — uniquely —
  **live tools that produce real numbers** (a duty calculator over 7,465 HS codes, an L/C
  discrepancy engine).
- That means video topics can be generated from **real data**: "what a container of garlic actually
  costs to land this month", "the five L/C mistakes that blocked payment this quarter". That content
  is not mass-produced; it is a data product with narration on top, and it is defensible.
- The agent handles production, scheduling, thumbnails, titles and the feedback loop. The **edge**
  comes from the owner's domain, not from the model.

This is also the only version where the existing `social-media-agent` system — which already measures
what worked and grades its own advice — becomes an asset rather than a parallel build.

## If it gets built, build it in this order

1. **Upload + schedule against the existing channel, manually fed.** Proves the API, the quota, and
   the metadata handling with zero risk.
2. **Assembly pipeline** — script → TTS → ffmpeg → file on disk. Proves the hard part, offline.
3. **Topic generation from the real data sources.** This is the differentiator; build it early, not
   last.
4. **Thumbnail + title generation**, reusing the existing design/copy agents.
5. **Close the loop** with the existing verdict mechanism (see `self-improving-agent-loop`) — did
   this video's topic/thumbnail/title actually beat baseline?
6. **Only then** consider a separate channel, once the pipeline has produced something a human would
   watch.

## What to tell the owner up front

- The pipeline is buildable and mostly free; **the laptop has to be on.**
- One video a day is achievable technically and is the **wrong** strategy for surviving platform
  policy.
- 1M subscribers is a goal. Nobody can architect a guarantee of it, and anyone who says otherwise is
  selling something.
- The version most likely to work is the one that uses **his** expertise as the input — which also
  means it cannot be fully autonomous, and that is a feature.

## Related

- `self-improving-agent-loop` — the feedback architecture this should reuse
- `windows-agent-automation` — scheduling and encoding on this machine
- `ruthless-venture-review` — the frame that produced this assessment

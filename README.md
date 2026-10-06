# Vishal Agarwal — AI context pack

**One place any AI assistant can read to know who I am, what I've built, how I work, and what I've
learned — plus 27 reusable skills you can install.**

Built for portability: Claude Code, ChatGPT, Cursor, Gemini, Copilot, or a human colleague.

**Latest context update: 6 October 2026.** The original August archive is now maintained alongside
dated current workspace and account-access notes. Start with
[`profile/04-accounts-and-access.md`](profile/04-accounts-and-access.md) for current connection
evidence, and [`work-history/updates/2026-10-06.md`](work-history/updates/2026-10-06.md) for the Codex
workspace setup. The owner explicitly requested ongoing repository updates; see rule 14 in the
working agreement. Private account addresses, credentials, and inbox contents stay outside this
public repository.

---

## Start here (60 seconds)

| If you are… | Read |
|---|---|
| An **AI assistant** starting work | [`AGENTS.md`](AGENTS.md) — the load order and the rules |
| **Claude Code** specifically | [`CLAUDE.md`](CLAUDE.md) |
| A **person** meeting me | [`profile/00-who-i-am.md`](profile/00-who-i-am.md) |
| Working **with** me for the first time | [`profile/01-how-i-work.md`](profile/01-how-i-work.md) |
| Evaluating the **skills** | [`ratings/SCORECARD.md`](ratings/SCORECARD.md) |
| Looking for the **war stories** | [`lessons/README.md`](lessons/README.md) |

## What's in here

```
profile/        who I am · how I work · my machine · my domain expertise · open questions
work-history/   a dated build log, and one file per project
skills/         27 skills — 9 compressed from real builds, 18 authored 13 Aug 2026
lessons/        the 20 most expensive things learned, ranked by what they cost
ratings/        a rubric you can re-run, and an honest scorecard
tools/          the scorer, an installer, and a one-file context pack builder
```

### The short version of me

Bangladeshi entrepreneur. Four operating businesses — **importing** agricultural commodities
(garlic, ginger, rice, pulses, spices), **exporting** handmade wigs to China, a **cement** dealership
in Naogaon, and **business education**. Author of *Prothom Container*. 28+ entrepreneurs mentored.

**I don't write code.** I paste secrets, click consent screens, add DNS records, and decide. In ten
weeks I went from "how do I make a website live" to running a multi-agent system that grades its own
past advice against measured outcomes. Everything in `skills/` came out of that.

Live: [iamvishalagarwal.com](https://iamvishalagarwal.com) ·
[kianben.com](https://kianben.com) ·
[garmentmind.vercel.app](https://garmentmind.vercel.app) ·
[the landed-cost calculator](https://iamvishalagarwal.com/landed)

## The skills

27 scored against a [published rubric](ratings/RUBRIC.md). **Mean 69.3/100, range 44–89, no skill
reached the A band** — the numbers are computed by a script in this repo, not asserted.

```bash
node tools/score-skills.mjs
```

**Project context** — a cold session can act from these
`vishal-agarwal-site` · `kianben-web` · `garmentmind` · `social-media-agent`

**Ship and verify**
`vercel-node-serverless` · `vercel-hobby-limits` · `prove-before-claiming` ·
`responsive-reveal-audit` · `zero-js-admin-panel` · `owner-admin-security` ·
`email-capture-and-delivery`

**Working with me / with the tools**
`session-to-project-skill` · `work-within-usage-limits` · `claude-code-setup-ops` ·
`windows-agent-automation` · `no-code-owner-handoff` · `content-integrity-guard`

**Bangladesh domain**
`bd-import-export-domain` · `bkash-payment-integration`

**Agents, media, judgement**
`self-improving-agent-loop` · `autonomous-channel-plan` · `brand-media-pipeline` ·
`public-data-without-api-keys` · `ruthless-venture-review`

**Design and build**
`ship-modern-3d-site` · `hero-canvas-fx` · `personal-mentor-website`

Third-party skills I also run (not vendored — they have their own licences) are listed with install
commands in [`skills/manifest.json`](skills/manifest.json).

## Install the skills

**Claude Code** — clone into your user skills directory so they work in every folder:

```bash
git clone https://github.com/hellokianben-collab/vishal-agarwal-context.git
cp -r vishal-agarwal-context/skills/*/ ~/.claude/skills/
```

Then restart your session. (Skip `manifest.json` — it is not a skill.)

**Any other platform** — build a single paste-able file:

```bash
node tools/build-context-pack.mjs > context-pack.md
```

**Pull one file directly** — every path resolves as a raw URL:

```
https://raw.githubusercontent.com/hellokianben-collab/vishal-agarwal-context/main/profile/01-how-i-work.md
```

## Ground rules for anything built from this

Four that override everything else:

1. **Never invent a fact about me, a customer, or a testimonial.** Unknowns go to
   [`profile/05-open-questions.md`](profile/05-open-questions.md) — ask, don't guess.
2. **Given the choice, take the harder option.** "You choose" is not permission to be safe.
3. **Deploy is part of done.** A local preview is not a result.
4. **Report what is verified *and* what is not.** A report with no gaps is not credible.

## What is deliberately not in this repo

No API keys, no connection strings, no admin keys, no tokens, no customer data, no private email
addresses. Where a secret is needed, the **variable name** is given and the value is mine to paste.
The scorer flags secret-shaped strings on every run.

## License

Content and skills: [CC BY 4.0](LICENSE) — use them, credit the source.
Third-party skills keep their own licences and are not redistributed here.

---

*Assembled 13 August 2026 from 83 session transcripts, 363 requests, and 10 project directories.
If something here is stale, the file that owns it says when it was last true.*

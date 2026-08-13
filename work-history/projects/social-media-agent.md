# Social media agent — a self-improving growth system

**Status:** running on schedule · **Built:** 2–5 Aug 2026 · **Stack:** local Python agent + Vercel
dashboard + Telegram + Vercel Blob queue · **Deep skill:** `skills/social-media-agent`

The most architecturally interesting thing in this history. It started as:

> *"I would like to learn how can i create an ai agent to monitor my social media platforms… I dont
> know anything about how to build agent. But, I would prefer your instruction to learn it. **And I
> would like to learn as i build that agent.**"*

---

## What it does

Monitors YouTube, Facebook and Instagram. Diagnoses *why* performance moved. Designs replacement
thumbnails, rewrites titles, proposes what to make next — and learns from what actually worked.

## The architecture: specialists that sleep

Six micro-agents, each with one job, each **woken only by the event it owns** and asleep otherwise.
That is a cost decision as much as a design one — every agent's context is paid for on every run, so
a generalist that reads everything gets expensive and vague at the same time.

| Agent | Wakes when | Owns |
|---|---|---|
| **Design** | a thumbnail needs judging or replacing | thumbnails, scored against the channel's own CTR baseline |
| **Copy** | a video's words are the problem | titles + the first 15 seconds, in the audience's own language |
| **Analyst** | daily | one briefing: what changed, why, and **one** instruction |
| **Meta** | FB/IG engagement or follower growth moves | Pages + Instagram |
| **Strategy** | weekly, or when an old video wakes up | what to make next, derived from what the audience already voted for |
| **Critic** | Sunday night | grades the other agents and **deletes claims the evidence doesn't support** |

A manager routes. `playbook.md` and `learned.md` hold the accumulated knowledge.

## The idea that makes it actually learn

This was Vishal's, refined in conversation:

> *"it watches whether you took its advice, without you telling it. Perceptual hash on thumbnails,
> string diff on titles. You swap a thumbnail → it notices, links it to the advice that suggested
> it, snapshots 7 days before/after, writes verdict: worked / no effect / backfired. **That verdict
> is the training signal.**"*

No self-reporting, no feedback form, no honour system. The agent observes the world, attributes the
change to its own prior advice, and grades itself against the measured outcome.

## The critic exists because agents flatter themselves

Every other agent has an incentive to sound useful. Over time that turns a knowledge base into a pile
of confident guesses, and then **every future piece of advice is confidently wrong**. The critic's
brief is explicitly the opposite: *"Be hard on yourself. A playbook full of flattering guesses is
worse than an empty one."* It deletes unsupported claims weekly.

This is the single most transferable idea in the repo — see `skills/self-improving-agent-loop`.

## Web control without a tunnel

The dashboard is a **read-only published copy**, but he wanted to act from the web too. Exposing a
laptop agent to the internet is the obvious answer and the wrong one.

Instead: the Vercel site writes a command into a **private Blob store**, and `run_sync.py` (Windows
Task Scheduler, every 15 minutes) pulls it with a token, applies it, acknowledges it, and
republishes. The whole command lives in the blob **pathname**, so `list()` reads the queue without
downloading anything. Telegram `/fix <n>` and `/skip <n>` do the same thing from a phone.

## Traps that cost real hours

1. **`claude` and `vercel` are `.cmd` shims on Windows.** A multi-line prompt passed as an argv
   element is truncated at the first newline — the model then answers a question it never received.
   Pipe through **stdin**, and resolve the binary with `shutil.which`.
2. **Google OAuth apps left in "Testing" lose their refresh token every 7 days.** Publish to
   "In production" or the agent dies silently every week.
3. **Meta renames its insight metrics constantly.** Never hardcode them — the code requests a
   deliberately invalid metric and parses the valid list out of Meta's own error message.
4. **Pillow here has no `raqm`**, so it cannot shape Bengali — Bangla renders as broken glyphs.
   Draft images use a Latin transliteration.
5. **Piping a value into `vercel env add` appends a newline**, silently breaking every password
   comparison. Trim on read.
6. **Vercel pre-parses JSON request bodies into an object.** A generic read-the-raw-body helper
   re-encoded that as form data and then failed to parse it — which silently left acknowledged queue
   items in place, so every sync re-ran the same work. Check `typeof req.body === 'object'` first.
7. **`@vercel/blob` below v2 cannot write to a private Blob store** — it rejects
   `access:'private'` before ever contacting the store.

## Open

A follow-on ask from 12 Aug 2026 — an agent that creates and runs a **new** YouTube channel
autonomously, one 10-minute video per day, using only free tools, targeting 1M subscribers — has been
scoped but not decided. See `skills/autonomous-channel-plan` for the honest feasibility read.

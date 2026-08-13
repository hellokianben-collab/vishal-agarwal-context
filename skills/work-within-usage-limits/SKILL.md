---
name: work-within-usage-limits
description: >-
  Plan and checkpoint long builds so a usage/context limit never destroys work in flight. Use when
  the user mentions a usage limit, token limit, "finish it before the limit hits", asks you to
  monitor remaining budget, asks to split a project into portions sized to the remaining budget, or
  says "Continue from where you left off". Also use unprompted at the start of any build expected to
  run more than an hour, or any multi-agent workflow — those are the two things that get cut off
  mid-flight and lose everything. Covers portioning, durable checkpoints, resumable state, and
  recovering findings from agents that died before reporting.
---

# Work within usage limits

The user's most-repeated operational constraint, stated directly:

> *"I want to create the final version of it… my main problem is your usage limit. I want you to
> monitor how much usage limit do you have left? and each time divide the project of creating the
> final version in portions that you can complete using the remaining usage limit. **By doing this we
> will not waste any usage.**"*

And separately: *"just finish it quickly before the usage limit hits"*, *"token limit is 30k"*.

The failure mode is not running out. It is running out **with the work only in the transcript**.

---

## Rule 1 — a portion is a thing that survives the session ending

Do not split by "phases of the code". Split by **what would still be true if the session died right
now**.

| Bad portion | Good portion |
|---|---|
| "Write the backend" | "One endpoint, deployed, returning 200 on the live URL" |
| "Design the schema" | "Migration written and run; `\d table` shows it" |
| "Investigate the bug" | "Findings written into the skill's gotcha section" |

Every portion ends with something **on disk or on a URL**. Never with something only in context.

## Rule 2 — checkpoint before you think you need to

Order of operations at the end of every portion:

1. Land the artifact (deploy / write the file / run the migration).
2. **Write the state down** — update the project skill or a `STATE.md`.
3. Only then start the next portion.

If the budget is visibly tightening, invert the order: **write the state first, then finish the
work.** A finished feature with no record of how it works is worth less than an unfinished one that
is fully documented.

## Rule 3 — make "Continue from where you left off" a cheap message

That exact sentence appears repeatedly in this user's history. Optimize for it.

A resumable checkpoint looks like:

```markdown
## State — <date, time>

**Done:** <specific, verifiable>
**In flight:** <the one thing half-finished, and exactly where it stopped>
**Next 3 steps:** 1. … 2. … 3. …
**Verify with:** <a command that proves the current state>
**Do not touch:** <anything out of scope>
```

Put it in the project skill, not in chat. Chat is not durable.

## Rule 4 — be honest about budget visibility

You generally **cannot read an exact remaining-usage number.** Say so once, plainly, and then
manage the risk with structure instead of a fake gauge:

- Size portions conservatively rather than claiming a precise forecast.
- Prefer three small landed portions over one large one that might not land.
- Never say "I have enough budget for this" as though you measured it.

Faking a budget readout to look responsive is worse than admitting the limit.

## Rule 5 — cheap answers to cheap questions

The user protects budget by asking narrow questions:

> *"can you deploy to vercel now. **don't do anything just answer in yes or no.**"*
> *"is this the final version? don't do anything just answer."*
> *"don't do anything explain first"*

When the message is a question, **answer it and stop.** Starting a build in response to a status
question spends his budget on something he did not ask for. This is not pedantry — it is the same
resource the actual work needs.

## Rule 6 — reduce cost per turn

- **Caveman mode is on** in this environment at full intensity. Terse output is a budget decision as
  much as a style one.
- Read the part of the file you need, not the whole file.
- Prefer one dense tool call over five exploratory ones; batch independent calls into one message.
- Do not re-read a file you just edited to "verify" — the edit would have errored.
- Do not re-derive facts already established in the conversation.

## Rule 7 — multi-agent workflows fail *silently* on limits

This has already happened here: a 7-lens audit lost 16 of 18 agents to a session limit.

**The trap:** the workflow returns `confirmedCount: 0`. That reads as *"no bugs found"*. It actually
means **verification never ran**.

Recovery:

1. Read `journal.jsonl` in the workflow transcript directory — it records each agent's actual return
   value, so findings from agents that *did* finish are recoverable.
2. Fall back to `agent-<id>.jsonl` files in the same directory.
3. Verify the recovered findings inline rather than re-running the whole fan-out.

**Never report a zero from a truncated run as a clean result.** Say how many agents completed.

## Rule 8 — what to do when you are clearly near the end

In order:

1. Stop starting new work.
2. Write the checkpoint (Rule 3).
3. Update the project skill with anything learned that would be expensive to rediscover.
4. Tell the user, in one line, exactly what is done, what is half-done, and what to say next time.

## Related

- `session-to-project-skill` — the format the checkpoint should land in
- `no-code-owner-handoff` — how to hand off mid-build to someone who won't debug it

---
name: session-to-project-skill
description: >-
  Compress a long build session into a durable project skill (plus a short memory note) so the next
  conversation resumes without re-deriving anything. Use when the user says "compress this
  conversation into a skill", "save the context", "so you have the context in a new conversation",
  "update the skill", "remember this", or when a session is about to end / hit a usage limit with
  hard-won state that only exists in the transcript. Also use proactively after any multi-hour build,
  any expensive debugging session, or any owner correction that must never regress. Produces a skill
  that a cold session can act from — not a summary of what happened.
---

# Turn a session into a durable project skill

This is the highest-leverage habit in this whole library. It was requested at least eight separate
times, and every good project skill here came out of it.

**The thing being saved is not the code.** Git has the code. What is expensive and undocumented is:
why it is built this way, what was already tried and failed, which facts the owner corrected, and
what breaks if you touch it.

---

## The test a good project skill must pass

> A brand-new session, given only this skill and no transcript, can be told *"fix the site"* and do
> the right thing — including knowing what NOT to touch.

If your draft fails that test, it is a summary, not a skill. Summaries are worthless here.

## What goes in — in this order

### 1. Frontmatter that actually triggers

The `description` is the only thing a cold model sees when deciding whether to load you. Write it
for retrieval, not for a human reader.

```yaml
---
name: <matches the directory name exactly>
description: >-
  <What it is + the stack, in one sentence.> Load this whenever the user works on <project>,
  "<the vague name they actually use>", <feature>, <feature>, or anything in <folder>. Use it even
  for vague asks like "fix the site", "it's broken on my phone", "deploy my changes", "why isn't X
  showing" — it carries <the things it carries>. For <adjacent concern> see `<other-skill>`.
---
```

Include the **user's own vocabulary**, not yours. If they call it "the import site", that phrase goes
in the description. If they say "the garment app", put that in.

### 2. Identity table — where everything lives

| Thing | Value |
|---|---|
| Local path | absolute path |
| Live URL | the real one |
| Hosting project / team | exact slugs |
| Git | repo URL — **or explicitly "not a git repo, deploys are CLI uploads"** |
| Local dev | the exact command and port |
| Deploy | the exact command |

"Not a git repo" is load-bearing information. Write it down.

### 3. Why it is built this way

The architecture decisions **and the rejected alternatives**. A decision without its rejected
alternative gets re-litigated in three weeks.

### 4. File map

One line per file, what it owns. This is what makes a cold session able to edit confidently instead
of grepping.

### 5. Facts the owner corrected — "DO NOT REGRESS"

Its own section, with a hard heading. Numbers, spellings, names, language rules, things removed on
request. These are the cheapest thing to get wrong and the most expensive to get wrong twice.

### 6. Expensive gotchas, numbered, with the symptom first

Format each one as **symptom → cause → fix**, because the next session meets the symptom, not the
cause.

> **`vercel domains inspect` LIES about which project owns a domain.** It listed two projects against
> one domain, which reads as a dangerous double-claim. It is not. The authoritative source is the
> per-project API: `curl -H "Authorization: Bearer $T" .../v9/projects/<p>/domains`.

Include what it cost ("cost an hour, 31 Jul") — that is how a future reader calibrates how carefully
to read.

### 7. A verification recipe that can be pasted

A block of real commands that proves the thing still works. Validity checks, regression greps, live
`curl`s with expected status codes. This is what makes the skill *self-testing*.

```bash
grep -rl "1,000+" .                       # a corrected fact must not have come back
curl -s -o /dev/null -w "%{http_code}\n" $B/api/health
```

### 8. Current state and what's open

A table with a status per area, dated. Plus the honest gap list — what is **not** real yet. Both of
those decay, so date them.

## What to leave out

- Blow-by-blow narrative of the session. Nobody will read it.
- Anything reconstructable by reading the code in ten seconds.
- Secrets. **Variable names yes, values never.**
- Praise for how the work went.

## Length and splitting

Keep `SKILL.md` under ~500 lines. Beyond that, split by *when it is needed*:

```
skills/<name>/
  SKILL.md              # always loaded — identity, rules, gotchas, verification
  references/
    architecture.md     # loaded when changing structure
    deploy.md           # loaded when shipping
```

Point at them explicitly from `SKILL.md` (*"full write-up: `references/deploy.md`"*), otherwise they
are dead weight.

## Also write the memory note

The skill is the manual; the memory note is the **pointer**. A session that has not loaded the skill
still needs to know it should.

```markdown
---
name: <project>-pointer
description: "<Project> at <path> — the full guide is the `<skill>` SKILL, load that."
metadata:
  type: project
---

<One paragraph: what it is, where it lives.>

**The full working guide is the `<skill>` skill** — load that rather than working from this note.

<Then repeat 3–6 traps here ONLY if they generalise beyond this project.>
```

## Updating an existing skill

Update, do not append. A skill that grows by accretion becomes a diary.

1. Read the whole file first — **concurrent sessions edit these**, and your memory of it may be stale.
2. Correct what changed **in place**.
3. Move anything now-false into the gotcha section as "this used to be true, here's what's true now",
   or delete it. A stale line is worse than a missing one.
4. Re-date the state table.

## Do it before the budget runs out, not after

Sessions get cut off mid-build. Write the skill **while you still have room**, then keep working.
An unwritten skill at the moment the context ends is a total loss of everything learned.

## Related

- `work-within-usage-limits` — when to checkpoint
- `content-integrity-guard` — what "DO NOT REGRESS" means in practice

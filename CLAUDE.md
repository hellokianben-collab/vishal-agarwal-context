# CLAUDE.md

Read [`AGENTS.md`](AGENTS.md) first — it is the full entry point and applies here unchanged. This
file adds only what is Claude Code specific.

---

## Skills

The 27 directories under `skills/` are drop-in Claude Code skills. Install at **user scope** so they
work in every folder:

```bash
cp -r skills/*/ ~/.claude/skills/
rm -rf ~/.claude/skills/manifest.json    # not a skill
```

Restart the session afterwards, then check they registered:

```bash
ls ~/.claude/skills/ | wc -l
head -5 ~/.claude/skills/prove-before-claiming/SKILL.md
```

If a skill does not appear under `/`, the cause is almost always one of three things — see
`skills/claude-code-setup-ops`.

## Environment specifics

- **Windows 11, PowerShell 5.1.** No `&&`. `claude` and `vercel` are `.cmd` shims that truncate
  multi-line argv at the first newline — pipe through stdin. Full list:
  `skills/windows-agent-automation`.
- **`gh` is not installed.** Use the GitHub REST API with a token.
- **`caveman` plugin runs at full intensity** via a `SessionStart` hook. Terse output is expected.
- **Everything installs at user scope (`-s user`).** This is a standing rule, not a preference.
- **The in-app browser preview pane lies** about these sites — frozen `requestAnimationFrame`,
  stale `getComputedStyle`, screenshot timeouts on animated pages. Verify with `curl`.
  Details: `skills/prove-before-claiming`.

## Which project skill to load

| Folder | Skill |
|---|---|
| `Desktop/claude/vishal-site` | `vishal-agarwal-site` |
| `Desktop/claude/kianben.web` | `kianben-web` |
| `Desktop/Garment` | `garmentmind` |
| `Desktop/claude/socialagent` | `social-media-agent` |
| `Desktop/claude/landed` | `vishal-agarwal-site` (the `/landed` sections) |

**Concurrent sessions edit these folders.** Re-read files before editing rather than trusting your
memory of them, and check mtimes if something looks different than you left it.

## Before you finish a session

Run `skills/session-to-project-skill`. Write the state down **while you still have budget**, not
after. `Continue from where you left off.` should be a cheap message to answer.

## Verifying your own work

`skills/prove-before-claiming` is not optional here. He will not catch your defects —
*"i want you to fullfill my role as well."*

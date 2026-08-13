---
name: claude-code-setup-ops
description: >-
  Install, scope, verify and debug Claude Code capabilities — MCP servers, skills, plugins and
  marketplaces — with a hard bias toward USER (global) scope so they work in every folder. Use
  whenever someone says "install this MCP", "add this skill", "install this plugin", pastes a
  `claude mcp add …` or `npx skills add …` command or a GitHub repo URL to install, or reports that
  something they installed "isn't showing in the / commands", "isn't listed in /mcp", "works in one
  project but not another", or "needs authentication". Also use before starting any task that a
  missing capability would cap — install the capability instead of shipping a weaker result.
  Windows-first (PowerShell 5.1, .cmd shims), but the scoping rules are cross-platform.
---

# Claude Code setup ops

The recurring failure this prevents: something gets installed, appears to work in the folder it was
installed from, and then silently does not exist anywhere else. It has happened with an MCP server,
with skills, and with plugins.

**The one rule: everything installs at user scope. Always. And say so out loud when you do it.**

---

## 1. Decide what kind of thing it is

| You were given | It is a | Install with |
|---|---|---|
| `claude mcp add …` / an HTTP URL ending `/mcp` | **MCP server** | `claude mcp add … -s user` |
| `npx skills add owner/repo` | **skill bundle** | `npx skills add …` then verify path |
| A GitHub repo URL with `SKILL.md` at root | **single skill** | clone into `~/.claude/skills/<name>` |
| A GitHub repo with `.claude-plugin/` or a marketplace manifest | **plugin** | add marketplace, then enable |
| `--header "x-api-key: …"` in the command | MCP **with a key** | never commit the key; see §5 |

If it is ambiguous, look at the repo root before running anything:

```bash
curl -s https://api.github.com/repos/<owner>/<repo>/contents/ | grep '"name"'
```

## 2. MCP servers — scope is the whole game

```bash
# correct
claude mcp add --transport http <name> <url> -s user

# with a header (key comes from the user, never hardcoded in a repo)
claude mcp add --transport http <name> <url> --header "x-api-key: $KEY" -s user

# stdio server
claude mcp add <name> -s user -- npx -y <package>
```

**Fixing one that was installed local:**

```bash
claude mcp remove <name> -s local
claude mcp add --transport http <name> <url> -s user
claude mcp list
```

**`-s local` is the default in some flows. That is the bug.** A local-scope server only appears when
`claude` is launched from that exact directory, which is why "it works in one project" is the
signature of a scoping mistake, not of a broken server.

**Verify, don't assume:**

```bash
claude mcp list                 # server present?
cat ~/.claude/mcp.json          # user-scope registry
cat ~/.claude/settings.json     # enabledMcpjsonServers must list it
```

A server can be present in `mcp.json` and still be inert if it is missing from
`enabledMcpjsonServers` in `~/.claude/settings.json`.

## 3. Skills

A skill is a directory containing `SKILL.md` with YAML frontmatter (`name`, `description`).

```bash
# user scope — available everywhere
git clone <repo> "$HOME/.claude/skills/<name>"

# a repo that contains MANY skills: link or copy each one individually
npx skills add <owner>/<repo>
```

**Verify it will actually trigger:**

```bash
ls ~/.claude/skills/<name>/SKILL.md            # exists?
head -5 ~/.claude/skills/<name>/SKILL.md       # frontmatter present, name matches dir?
```

Three reasons a skill does not show in `/`:

1. **No `SKILL.md` at the directory root** (it's one level deeper — a common clone layout).
2. **Frontmatter `name:` disagrees with the directory name.**
3. **Installed project-local** (`./.claude/skills/`) instead of `~/.claude/skills/`. Same class of
   bug as MCP scope.

A restart of the session is needed after adding a skill. Say that rather than letting the user
conclude it failed.

## 4. Plugins and marketplaces

```jsonc
// ~/.claude/settings.json
"extraKnownMarketplaces": {
  "<marketplace-id>": { "source": { "source": "github", "repo": "<owner>/<repo>" } }
},
"enabledPlugins": { "<plugin>@<marketplace-id>": true }
```

Plugins can ship skills, hooks, statuslines and commands together — which is why a plugin can change
behaviour globally in a way a skill cannot. Check `enabledPlugins` before debugging "why is the model
acting like this".

## 5. Keys and secrets — the standing rule

- The user pastes keys. They go into the MCP config or the environment, **never into a repo, a skill
  file, or a commit.**
- If a key ends up in something that will be published, treat it as compromised and tell the user to
  rotate it. Do not quietly redact and move on.
- Some servers require an **interactive OAuth flow** that cannot run in a non-interactive session.
  When that is the case, say plainly: *"this server needs authorization — run `/mcp` in an
  interactive `claude` session, or authorize it in your claude.ai connector settings"*. Never ask the
  user for an authorization code, token, or callback URL.

## 6. Diagnostic ladder for "it isn't showing"

Run these in order. Stop at the first one that fails.

```bash
claude mcp list                                     # 1. registered at all?
cat ~/.claude/mcp.json | grep -A3 '"<name>"'        # 2. at USER scope?
grep -A5 enabledMcpjsonServers ~/.claude/settings.json   # 3. enabled?
ls ~/.claude/skills/                                # 4. skill dir where it should be?
head -5 ~/.claude/skills/<name>/SKILL.md            # 5. frontmatter valid?
```

Then: **restart the session.** Most "not showing" reports are a registry that is correct and a
session that started before it was.

## 7. Before starting a capped task

If the quality of what you are about to deliver is limited by a capability you do not have — a
skill, an MCP connector, a plugin — the correct move is to **get it**, not to work around it:

- Search and install what fits (`find-skills`, the plugin marketplace, the MCP registry).
- If only the user can add it (credentials, an authenticated connector, a paid plugin), say exactly
  what to add and why, **before** delivering, not in a footnote after.

Never absorb a missing capability into a quieter, worse result. That has been called out explicitly
as unacceptable.

## Windows notes

- `claude` and `vercel` on PATH are `.cmd` shims. Scripts invoking them must resolve the real path
  (`shutil.which`) and pipe multi-line input through **stdin** — argv gets truncated at the first
  newline by `cmd.exe`.
- PowerShell 5.1 has no `&&`. Chain with `;` and `if ($?) { … }`.
- `~` in Git Bash is `C:/Users/<name>`; in PowerShell use `$HOME` or `$env:USERPROFILE`.

## Related

- `windows-agent-automation` — the shell-level traps in depth
- `no-code-owner-handoff` — how to write the install steps for someone who won't debug them

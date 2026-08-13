# Tech environment

Everything an assistant needs to know about the machine, the accounts, and the hard limits — so it
stops re-discovering them.

> **No secrets in this file.** API keys, connection strings, admin keys and tokens are deliberately
> absent. Where one is needed, the *variable name* is given and the value is the owner's to paste.

---

## Workstation

| | |
|---|---|
| OS | Windows 11 Pro (26200) |
| Windows profile | `C:\Users\Susanta Podder` |
| Primary work dir | `C:\Users\Susanta Podder\Desktop\claude` |
| Shells | PowerShell **5.1** (primary) + Git Bash |
| Runtimes | Node.js (`C:\Program Files\nodejs`), Python 3.14 (`C:\Python314`) |
| Installed CLIs | `git`, `npm`, `vercel@54.x`, `@railway/cli`, `claude` (Claude Code 2.x) |
| **Not installed** | `gh` (GitHub CLI). Use the GitHub REST API with a token instead. |
| Git credentials | Git Credential Manager, `git-credential-manager.exe` |

### Windows traps that have already cost hours

1. **`claude` and `vercel` are `.cmd` shims.** Passing a multi-line prompt as an argv element gets
   it **truncated at the first newline** by `cmd.exe`, and the model then answers a question it
   never received. **Pipe prompts through stdin.** `subprocess` also cannot resolve the bare name —
   resolve the full path with `shutil.which(...)` first.
2. **PowerShell 5.1 has no `&&`, no `||`, no ternary, no `??`.** Use `;` and `if ($?) { }`.
   Avoid `2>&1` on native executables — it wraps stderr lines in ErrorRecords and flips `$?` to
   false even on exit code 0.
3. **`Set-Content`/`Add-Content` default to the system ANSI codepage.** Pass `-Encoding utf8`
   explicitly for anything another tool will read.
4. **Python's default stdout codec on this box is cp1252** — printing `→` or `৳` throws
   `UnicodeEncodeError`. Set `PYTHONIOENCODING=utf-8`.
5. **Pillow here has no `raqm`** (`features.check('raqm') == False`), so it cannot shape Bengali —
   Bangla renders as broken glyphs in generated images. Use a Latin transliteration for drafts.
6. Long-running jobs run under **Windows Task Scheduler**, not cron.

---

## Hosting and infrastructure

| Layer | Choice | Notes |
|---|---|---|
| Hosting | **Vercel**, team `susanta-podders-projects` | **Hobby plan** — see the limits below |
| Database | **Neon Postgres** | Provisioned through the Vercel Marketplace integration |
| Email | **Resend** | Domain `iamvishalagarwal.com` verified. `MAIL_FROM` is mandatory. |
| DNS | **Namecheap** | Third-party DNS, which makes domain moves dangerous — see below |
| Payments | **bKash PGW** (tokenized checkout) + manual **bKash/Nagad** TrxID flow | Merchant creds pending |
| Blob storage | Vercel Blob (`@vercel/blob` **v2+**, older versions cannot write private stores) | |

### Vercel Hobby limits that shape the architecture

- **12 serverless functions per deployment, hard cap.** Vercel builds **one function per file under
  `api/`**. The error arrives at deploy time, not while coding. The answer is architectural, not a
  paid upgrade: keep real handlers in `lib/routes/` and put a handful of thin routers in `api/` that
  dispatch on `?do=`, with `vercel.json` rewrites preserving every public URL.
  `iamvishalagarwal.com` went 16 functions → 4 routers this way.
- **4.5 MB response body cap** (`FUNCTION_PAYLOAD_TOO_LARGE`). Anything bigger must be served as
  byte ranges or 302'd to storage.
- **Vercel checks the filesystem *before* rewrites.** A rewrite for `/admin` is silently dead while
  `admin.html` exists.
- **Rewrites *merge* the incoming query string into the destination's** rather than replacing it.
  A path rewritten to `?do=page` cannot also accept an incoming `?do=signup` — the first one wins,
  the form silently falls through, and nothing appears in the logs.
- **`vercel env pull` returns `""` for "Sensitive" vars.** An empty read is **not** evidence the
  variable is unset.
- **Piping a value into `vercel env add` appends a newline**, which silently breaks every string
  comparison downstream. Trim env vars on read.
- The Vercel CLI auth token lives at
  `AppData/Roaming/xdg.data/com.vercel.cli/auth.json` — **not** `~/.vercel`.

### Domain moves are the single most dangerous operation

Moving a domain between Vercel projects **on third-party DNS** took `iamvishalagarwal.com` down for
~20 minutes. Detaching resets verification; Vercel then demands a `_vercel` TXT record and the
domain 404s on **both** projects until it exists. Re-attaching does not undo it.

**Correct order: add the `_vercel` TXT record FIRST, then move.** And note that
`vercel domains inspect` **lies** about which project owns a domain — check the per-project API
endpoint instead.

---

## Accounts and identities

| Service | Identity | Notes |
|---|---|---|
| GitHub | `hellokianben-collab` | Authenticated on this machine (Credential Manager). Owns `kianben.web`. |
| GitHub | `calesthio` | Owns the `OpenMontage` fork/clone. Not authenticated locally. |
| Vercel | team `susanta-podders-projects` | Hobby |
| Neon | via Vercel Marketplace, resource `neon-cerulean-tree` | |
| Resend | registered under a different address than Vishal's public one | Worth transferring to him |
| Google Cloud | OAuth app for YouTube Data API | **Must be published to "In production"** — apps left in "Testing" lose their refresh token every 7 days and the agent dies silently each week |
| Meta | Facebook Page + Instagram Graph API | Meta renames insight metrics constantly — never hardcode metric names |

---

## Claude Code configuration

```
model:        opus
effortLevel:  medium
theme:        dark
workflows:    enabled
```

**Plugins:** `caveman` (JuliusBrussee/caveman) at **full** intensity, wired through a `SessionStart`
hook + `UserPromptSubmit` tracker + a PowerShell statusline. `ui-ux-pro-max`
(nextlevelbuilder/ui-ux-pro-max-skill).

**MCP servers (user scope):** `21st` (21st.dev component search), `heygen` (AI video),
plus Higgsfield, Desktop Commander, and the Claude-in-Chrome extension.

**Standing rule:** every MCP server and skill installs at **user scope** (`-s user`). If one was
added locally, remove and re-add:

```bash
claude mcp remove <name> -s local
claude mcp add --transport http <name> <url> -s user
```

---

## Live properties

| URL | What it is | Stack |
|---|---|---|
| https://iamvishalagarwal.com | Personal/brand site, book sales, consultations, admin | Static HTML/CSS/JS + 4 Vercel functions + Neon |
| https://kianben.com | Shared-import community, book shop, member sign-in | Express on Vercel serverless + Neon |
| https://iamvishalagarwal.com/landed | Bangladesh landed-cost + NBR duty calculator | Static, 7,465 HS codes |
| https://iamvishalagarwal.com/community | Member accounts + saved calculations | Serverless + Neon |
| https://iamvishalagarwal.com/invoice | Free invoice generator | Static |
| https://garmentmind.vercel.app | L/C discrepancy checker for garment exporters | FastAPI + React + Postgres |
| https://socialagent-dashboard.vercel.app | Social media agent dashboard (password-gated) | Vercel + Blob queue |

---

## Related

- `lessons/` — the individual gotchas above, each as a standalone portable note
- `skills/vercel-node-serverless` — the full serverless playbook
- `skills/windows-agent-automation` — the Windows traps in depth

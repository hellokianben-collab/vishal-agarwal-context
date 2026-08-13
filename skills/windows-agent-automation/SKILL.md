---
name: windows-agent-automation
description: >-
  Windows-specific traps when an agent or script drives CLIs, schedules jobs, or generates files on
  Windows — .cmd shims truncating multi-line input, PowerShell 5.1 missing operators, encoding
  defaults that corrupt output, Task Scheduler instead of cron, and path/credential locations. Use
  when writing any Python/Node script that shells out on Windows, scheduling a recurring job,
  debugging "it works when I type it but not from the script", seeing UnicodeEncodeError or garbled
  characters, or when a subprocess cannot find a command that is clearly on PATH. Every trap here has
  already cost real hours on this machine.
---

# Windows automation traps

Environment: **Windows 11**, PowerShell **5.1**, Git Bash available, Node + Python 3.14, no `gh` CLI.

---

## 1. `claude` and `vercel` on PATH are `.cmd` shims — this is the expensive one

Two separate failures, both silent:

**a) Multi-line input passed as an argv element is truncated at the first newline.**

```python
# WRONG — cmd.exe cuts the prompt at the first \n. The model answers a question it never received.
subprocess.run([claude, "-p", long_multiline_prompt])

# RIGHT — pipe through stdin
subprocess.run([claude, "-p"], input=long_multiline_prompt, text=True, encoding="utf-8")
```

The output looks *plausible*, which is why this can survive for days. If a model's answer seems to
ignore most of your prompt, check this before anything else.

**b) `subprocess` cannot resolve the bare name.**

```python
import shutil
claude = shutil.which("claude")     # → the full .cmd path
if not claude: raise RuntimeError("claude not on PATH")
```

`shell=True` also "works" and brings quoting problems with it. Resolve the path instead.

## 2. PowerShell 5.1 is missing operators you will reach for

| Not available | Use |
|---|---|
| `&&` | `A; if ($?) { B }` |
| `\|\|` | `A; if (-not $?) { B }` |
| ternary `? :` | `if/else` |
| `??`, `?.` | explicit `if ($null -eq $x)` |
| `ConvertFrom-Json -AsHashtable` | returns `PSCustomObject`; index accordingly |

**Do not redirect a native executable's stderr with `2>&1`.** PowerShell 5.1 wraps each line in an
ErrorRecord (`NativeCommandError`) and sets `$?` to `$false` **even when the exe returned 0**.

**Here-strings:** the closing `'@` must be at **column 0**. Indenting it is a parse error. Use
`@'…'@` (literal), not `@"…"@`, unless you actually want interpolation.

## 3. Encoding will corrupt your output silently

- **Python stdout defaults to cp1252 here.** Printing `→`, `৳`, or an em-dash throws
  `UnicodeEncodeError: 'charmap' codec can't encode character`. Set `PYTHONIOENCODING=utf-8`, or
  open files with `encoding="utf-8"` explicitly. Always pass `errors="replace"` when reading logs of
  unknown origin.
- **`Set-Content` / `Add-Content` default to the system ANSI codepage.** Pass `-Encoding utf8` for
  anything another tool will read. (`Out-File` and `>` usually give UTF-8-with-BOM here — the BOM
  itself breaks some parsers.)
- **Pillow here has no `raqm`** (`PIL.features.check('raqm') == False`), so complex scripts —
  Bengali, Arabic, Devanagari — render as broken, unshaped glyphs. There is no runtime workaround;
  use a Latin transliteration for generated drafts and say so.

## 4. Paths

- Git Bash sees `C:/Users/Name`; PowerShell wants `$HOME` / `$env:USERPROFILE`.
- **Spaces in the path are guaranteed here** (`C:\Users\Susanta Podder\…`). Quote everything.
- `cd` inside a compound Bash command can trip permission prompts — prefer absolute paths.
- Short (8.3) names appear in temp paths (`C:\Users\SUSANT~1\…`). They are valid; don't "fix" them.

## 5. Credentials and CLI state live in non-obvious places

| Thing | Location |
|---|---|
| Vercel CLI token | `AppData/Roaming/xdg.data/com.vercel.cli/auth.json` — **not** `~/.vercel` |
| Git credentials | Git Credential Manager (`git-credential-manager.exe`) |
| Read a stored git credential | `printf "protocol=https\nhost=github.com\n\n" \| git credential fill` |

**`gh` (GitHub CLI) is not installed.** Use the REST API with a token:

```bash
curl -s -H "Authorization: Bearer $TOK" https://api.github.com/user
```

## 6. Scheduling — Task Scheduler, not cron

```powershell
$action  = New-ScheduledTaskAction -Execute "C:\Python314\python.exe" `
                                   -Argument "C:\path\to\run_sync.py" `
                                   -WorkingDirectory "C:\path\to"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
                                    -RepetitionInterval (New-TimeSpan -Minutes 15)
Register-ScheduledTask -TaskName "agent-sync" -Action $action -Trigger $trigger
```

Rules for scheduled agents:

- **Absolute paths everywhere.** The task's working directory is not your shell's.
- **The environment is not your interactive environment.** Anything from a shell profile is gone —
  pass it explicitly or read it from a file.
- **Idempotent runs.** A double-fire must not double-post.
- **Log every run's outcome to a file the owner can open.** A silent agent is indistinguishable from
  a dead one.
- The machine must be **on and awake**. Tell the owner this before they discover it.

## 7. Non-interactive gotchas

Scripts here run with stdin attached to null. Anything that prompts will hang or read EOF:

- Never `Read-Host`, `Get-Credential`, `Out-GridView`, `pause`, or `$Host.UI.PromptForChoice`.
- Destructive cmdlets prompt by default — add `-Confirm:$false` when you mean it.
- Never `git rebase -i`, `git add -i`, or anything opening an editor.
- `-ErrorAction SilentlyContinue` suppresses the *message* but the failure still exits 1. To truly
  swallow: `try { … -ErrorAction Stop } catch {}`.

## 8. Vercel CLI on Windows

- **Piping a value into `vercel env add` appends a newline**, silently breaking every string
  comparison downstream. Trim env vars on read.
- **`vercel env pull` returns `""` for Sensitive vars.** Empty is not proof of unset.
- `vercel env add <NAME> preview` **fails non-interactively** when there is no git repo — it wants a
  branch. Production and Development still work.

## Quick pre-flight for any new Windows automation script

```python
import shutil, os, sys
BIN = shutil.which("vercel") or sys.exit("vercel not on PATH")
os.environ.setdefault("PYTHONIOENCODING", "utf-8")
# multi-line payloads go through stdin, never argv
```

## Related

- `claude-code-setup-ops` — installing and scoping tooling on this machine
- `self-improving-agent-loop` — what the scheduled job should actually do

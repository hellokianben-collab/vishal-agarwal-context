---
name: no-code-owner-handoff
description: >-
  Hand a working system to a non-technical owner so they can actually run it — click-by-click setup
  with expected results, a secrets checklist they only paste, a runbook for the three things that
  break, and an honest capability/limit list. Use when the person you're building for does not write
  code, when writing SETUP.md / README for an owner rather than a developer, when a task needs the
  owner to click a consent screen or add a DNS record or paste an API key, or when a build is
  finished and needs to be handed over. Also use when deciding how much to automate versus explain.
---

# Handing off to an owner who does not code

The standing constraint here:

> *"He has no coding background and does not want to write code — he only clicks consent screens and
> pastes secrets. Write everything for him, click-by-click."*

And the delegation is genuine:

> *"I permit you to do these things i don't want to do it, and don't have time to do as well… finish
> it and check everything once."*

So the design goal is: **the owner's total surface area is a browser, a copy-paste, and a yes/no.**

---

## 1. Do the work. Don't teach the work.

Default to doing it yourself. Escalate to the owner only for things that are genuinely gated on
being them:

| Owner must do it | You do it |
|---|---|
| Click an OAuth consent screen | Register the app config |
| Accept terms of service | Run the provisioning command |
| Paste an API key from their account | Set the env var, wire it, verify it |
| Add a DNS record at the registrar | Everything either side of it |
| Approve spending money | Everything free |
| Decide a price, a name, a fact about themselves | All the implementation |

If you are about to ask the owner to run a command, **first check whether you can run it.** Usually
you can.

## 2. The shape of a step

Every step needs three parts. Missing the third is the most common failure, because without it the
owner cannot tell success from silence.

```
### Step 4 — Publish the OAuth app

1. Open https://console.cloud.google.com/apis/credentials/consent
2. Click "PUBLISH APP"
3. Confirm in the dialog

✅ You should see: Publishing status = "In production"

⚠️ If you skip this, Google deletes your login every 7 days and the agent
   silently stops working.
```

- **Exact URL**, not "go to your dashboard".
- **The literal button text**, not "the publish option".
- **The expected result**, stated.
- **The consequence of skipping it**, when there is one.

Number the steps. Give a time estimate per section. Mark which steps are optional.

## 3. Secrets: a checklist, never a hunt

One table, in one place, with where each value comes from:

| Variable | Where to get it | Required? |
|---|---|---|
| `RESEND_API_KEY` | resend.com → API Keys → Create | yes — no email without it |
| `MAIL_FROM` | leave as given | yes |
| `BKASH_APP_KEY` | bKash merchant portal → API credentials | only for live payments |

Rules:

- **Never ask for a password.** Only tokens/keys that can be rotated.
- Say **what happens without it** — an optional-looking variable that silently disables greeting
  emails is not optional in practice.
- Tell them where the value ends up and that **you never need to see it again**.
- Warn once that a key pasted into a chat is now in a chat log, and can be rotated.

## 4. The runbook: three things, not thirty

An owner will not read a troubleshooting appendix. Pick the **three most likely failures**, and for
each: symptom in their words → one check → one fix.

```
"The website looks broken / unstyled"
  → hard refresh (Ctrl+Shift+R). If still broken, tell me — it's a deploy issue, not you.

"I'm not getting the emails"
  → check spam first. Then tell me — it's almost always the sender domain, and I fix it.

"The agent stopped posting"
  → is the computer on and awake? It only runs when the laptop is running.
```

Note the pattern: **two of the three end in "tell me".** That is correct. The runbook's job is to
help them classify the problem, not to make them fix it.

## 5. State the limits before they discover them

Things an owner will otherwise find out at the worst moment:

- **"The computer must be on."** A locally scheduled agent does not run on a closed laptop. Say it
  up front, every time.
- **What the system cannot see.** A downloaded PDF cannot report reading progress; a private
  Instagram cannot be scraped. Print the limitation on the dashboard next to the number it affects,
  so it is read at the moment it matters.
- **What is dormant and why.** "Payments are built and tested but switched off until your merchant
  credentials arrive" is a completely different message from silence.
- **What is mock.** If extraction returns fixture data, that belongs in the first paragraph of the
  README, not in a footnote.

## 6. One dashboard, not a log file

Everything the owner needs to know is a **page they can open on a phone**:

- What happened, in their language, most recent first
- The numbers that matter, with the limitation printed next to them
- The action buttons — and every action answered with a visible notice, never silence
- No JavaScript required (see `zero-js-admin-panel`) — their browser has extensions and you cannot
  audit them

## 7. Verify it for them, then say so plainly

> *"finish it and check everything once."*

Do the verification, then report it as **evidence, not reassurance**:

```
Verified live just now:
  /            200
  /contact     200
  waitlist     accepts a real address, rejects a fake domain with a reason
  greeting     delivered (message id logged)
  admin        loads with 0 <script> tags

Not verified — needs you:
  bKash live payment (needs your merchant credentials)
```

**Always include the "not verified" list.** A report with no gaps in it is not credible, and it is
how a broken thing ships looking green.

## 8. Language

- Their vocabulary, not yours. "The buy button" not "the `data-onsale` flag".
- Bold the one thing that matters per step.
- Short paragraphs. A wall of text is not read.
- Never say "simply" or "just". If it were simple they would have done it.
- Terse is good — but **not for multi-step instructions they must follow by hand**. Clarity beats
  brevity exactly there.

## 9. Handoff checklist

- [ ] Every step has an exact URL, the literal button text, and the expected result
- [ ] Steps are numbered, with a time estimate per section
- [ ] Optional steps are marked optional
- [ ] Secrets are in one table, with where each comes from and what breaks without it
- [ ] No step asks for a password — only rotatable tokens
- [ ] The runbook has **three** entries, not thirty
- [ ] "The computer must be on" is stated if anything runs locally
- [ ] Anything mock, dormant, or unverified is named in the first paragraph
- [ ] A verification report was run, with **both** lists (verified / not verified)
- [ ] The dashboard works with JavaScript disabled

```bash
# the one-line proof for the last item
curl -s https://your-site.com/admin | grep -c '<script'    # expect 0
```

*Derived from handoffs on 28 July, 3 August and 5 August 2026.*

## Related

- `owner-admin-security` — the recovery path when the owner loses their device
- `session-to-project-skill` — the developer-facing counterpart to this document

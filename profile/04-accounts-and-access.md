# Accounts and access — dated verification

Last reviewed: **6 November 2026** for Vercel; other sections retain **6 October 2026** checks. Account names do not establish personal
identity. Access and authorization can change; recheck before a dependent task.

## Vercel

**6 November 2026:** the connector returned team-access 403 even after the owner reported consent.
The CLI default lookup reported no credentials, but the existing credential directory at
`AppData/Roaming/xdg.data/com.vercel.cli` worked with `--global-config`. `whoami` returned
`susanta-podder`; project inspection and the per-project domains API verified the same website
project and existing apex/www domain mappings. The authorized image refresh was deployed as
`dpl_EnT8tvBKvVKA9fKocLf4tVMayJ6h` and verified on the original domain. No DNS changes were needed.
Do not copy tokens or credential file contents into reports or this repository.

Historical verification, **6 October 2026**:

- CLI sign-in completed using the owner's browser authorization.
- `vercel whoami` returned **susanta-podder**.
- `vercel project inspect vishal-site --scope susanta-podders-projects` confirmed project
  `prj_q7Qp4KfoEcmooi8zbeGqV5XOqiTW` is accessible.
- `vercel inspect https://iamvishalagarwal.com --scope susanta-podders-projects` identified a
  **Ready production deployment** of `vishal-site` with aliases `iamvishalagarwal.com`,
  `www.iamvishalagarwal.com`, and `vishal-site-five.vercel.app`.
- No production deployment, DNS/account setting change, or live-service test was performed.
- A previously saved token was invalid; successful fresh sign-in supersedes that historical failure.

## Gmail

- The connected Gmail profile repeatedly returned the already-public address
  **mvishal550@gmail.com**.
- Vishal supplied **three additional work Gmail addresses** and requested access to them. The
  private addresses are retained only in the workspace's ignored local account inventory.
- After the connection attempts, the available Gmail profile still returned the public account.
  Access to all three work inboxes remains **unverified**.
- The currently exposed Gmail tool offers no account-selection or account-listing parameter.
  This does not establish whether additional accounts are connected in the product UI.
- Google authorization still requires the owner to complete its own sign-in/consent steps.
  Do not copy authentication codes or private inbox content into this repository.

## GitHub

- The context repository is **public** and its default branch is `main`.
- The connected GitHub app profile reports username **vishalagarwalglobal-ux**.
- Its repository metadata reports read access and **no push permission** for
  `hellokianben-collab/vishal-agarwal-context`.
- HTTPS Git cloning and updating the local checkout succeeded. Git Credential Manager may use
  different credentials than the connected app; successful reads do not prove write access.
- GitHub CLI was installed but signed out during the initial environment setup. Verify credentials
  before relying on it. Independently, **local Git publishing was verified on 6 October 2026**:
  `git push origin main` successfully published the reviewed context update. The GitHub app's
  read-only connection and the working local Git credentials are separate access paths.

## Other services

Existing Codex configuration lists `21st`, `heygen`, and `node_repl` MCP servers and the Caveman
and UI/UX Pro Max plugins. Their presence was observed; their external authorization was not
tested in this setup. Resend sender setup, production database persistence, bKash round-trips,
the actual book PDF, and meeting integrations were not reverified.

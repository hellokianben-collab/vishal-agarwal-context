# Phase 5 — Deploy to Vercel (the gotcha playbook)

This is the highest-value file. A Next.js deploy can show "Ready" yet the live URL fails to load — and the cause is almost always **config, not code**. Diagnose by reading the HTTP response, then apply the matching fix.

## 0. The no-auth fallback is dead

The `deploy-to-vercel` skill's no-auth claimable endpoint (`claude-skills-deploy.vercel.com/api/deploy`) is **deprecated** — it now returns a JSON message telling you to use the Vercel CLI. Don't waste a round on `deploy.sh`. Go straight to the CLI.

## 1. Install + authenticate

```bash
npm install -g vercel
vercel whoami            # check existing auth
```

Headless auth (no interactive provider menu): pass the email — it falls through to a **device-code flow**:

```bash
vercel login you@example.com
# prints: Visit https://vercel.com/oauth/device?user_code=XXXX-XXXX
# user opens that URL (logged into Vercel), approves; CLI continues. No stdin needed.
```

Alternative (CI / fully headless): create a token at vercel.com/account/tokens and use `vercel <cmd> --token <T>`.

**Token on disk (Windows):** `C:\Users\<user>\AppData\Roaming\xdg.data\com.vercel.cli\auth.json` → `.token`. Needed for the API PATCH calls below.

## 2. Create + link the project (folder-name trap)

`vercel deploy --yes` derives the project name from the folder and **rejects uppercase/spaces** → `Error: Project names ... must be lowercase`. Create a valid-named project explicitly, link, then deploy:

```bash
vercel project add vishal-portfolio
vercel link --yes --project vishal-portfolio
vercel deploy --prod --yes            # add --no-wait to return the URL immediately
```

Linking writes `.vercel/project.json` → `{ "projectId": "prj_…", "orgId": "team_…" }`. `orgId` is the `teamId` for API calls. Poll readiness with `vercel inspect <url>` (look for `● Ready`).

## 3. Diagnose a "not loading" deployment

Read the response headers — the error code tells you which fix to apply:

```bash
curl -sS -D - -o /dev/null --max-time 25 "https://<deployment>.vercel.app"
```

| Symptom                                                                                 | Meaning                                                    | Fix                         |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------- |
| **401** + `Set-Cookie: _vercel_sso_nonce=…`                                             | Deployment Protection ON                                   | §4 — disable SSO protection |
| **404** `X-Vercel-Error: NOT_FOUND` (even on the immutable deploy URL, build was Ready) | `framework: null` → served as static, Next runtime ignored | §5 — set framework=nextjs   |
| **404** `NOT_FOUND` + project shows a `link` to a GitHub repo                           | stray git auto-connect stole the production alias          | §6 — disconnect git         |

API base for fixes (Bearer = token from §1):

```
PATCH https://api.vercel.com/v9/projects/<projectId>?teamId=<teamId>
Authorization: Bearer <token>   Content-Type: application/json
```

## 4. 401 — Deployment Protection (on by default)

New projects gate ALL deployments behind Vercel SSO → public visitors get 401 + an `_vercel_sso_nonce` cookie. Make production public (keep previews protected):

```bash
curl -sS -X PATCH "https://api.vercel.com/v9/projects/$PID?teamId=$TEAM" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"ssoProtection":{"deploymentType":"preview"}}'
# or to disable entirely: -d '{"ssoProtection":null}'
```

## 5. 404 NOT_FOUND despite a green build — `framework: null`

**This was the actual "site not loading" cause.** If the project's `framework` is `null`, Vercel runs `next build` but then serves the project as a **generic static site** (looks for static output, ignores Next's `.next` runtime) → every route 404s, even though build logs show `next build` succeeded and prerendered `/`. Build logs say `Build Completed in /vercel/output`, yet `X-Vercel-Error: NOT_FOUND`.

```bash
curl -sS -X PATCH "https://api.vercel.com/v9/projects/$PID?teamId=$TEAM" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"framework":"nextjs"}'
vercel deploy --prod --yes --force     # rebuild so the Next runtime is used
```

## 6. Stray GitHub auto-connect

Vercel may auto-link a same-named GitHub repo (`project.link.type: "github"`, `productionBranch: "main"`). With no commit on `main`, the production alias points at a non-existent git deployment → CLI deploys don't own the production domains → NOT_FOUND. Disconnect, then redeploy:

```bash
vercel git disconnect --yes
vercel deploy --prod --yes --force
```

## 7. Verify it's truly live

```bash
curl -sS -o /dev/null -w "%{http_code}\n" "https://<project>-<scope>.vercel.app"   # want 200
# confirm real content, not a blank 200:
curl -sS "https://<project>-<scope>.vercel.app" | grep -oiE "<title>[^<]*</title>" | head -1
```

Useful inspectors: `vercel inspect <url> --logs` (build logs), `vercel inspect <url>` → grep `Aliases`, `vercel ls <project> --prod`. The stable production alias is `<project>-<scope>.vercel.app` (the random `<project>-<hash>` and `<project>-<random>.vercel.app` aliases can 404 if not assigned — use the scoped one).

## 8. Housekeeping

- `rm -rf .next` before deploying (lean upload).
- Production target: `vercel deploy --prod` (the skill default is preview; a portfolio you want public is the production exception).
- For long-term auto-deploy, set up git push-to-deploy _intentionally_ (GitHub repo + `vercel link --repo`) rather than relying on the flaky auto-connect — disconnect-and-CLI is the reliable path when auto-connect tangles routing.

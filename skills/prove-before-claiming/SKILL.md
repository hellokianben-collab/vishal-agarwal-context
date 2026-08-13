---
name: prove-before-claiming
description: >-
  Verify that a change actually works before reporting it done — offline test harnesses with real
  Postgres in WASM, live smoke tests against production, regression greps, and the rule that a
  tool which lies must never be the evidence. Use before saying "done", "deployed", "fixed" or
  "verified"; when a change touches money, auth, email or data; when a browser preview disagrees with
  reality; or when a multi-agent verification pass returns zero findings. Carries the harness
  patterns, the honest-reporting format that always names what was NOT verified, and the specific
  tools in this environment that report false results.
---

# Prove it works, then say it works

The standing expectation:

> *"finish it and check everything once."*
> *"find bugs yourself… i want you to fullfill my role as well."*

The owner will not catch your defects. So "done" is a claim that has to be backed, and the backing
has to come from something that does not lie.

---

## 1. The four levels, cheapest first

| Level | Proves | Cost |
|---|---|---|
| **Syntax / validity** | the file parses | seconds |
| **Regression grep** | a corrected fact hasn't come back | seconds |
| **Offline harness** | the logic is right, including edge cases | minutes |
| **Live smoke test** | the deployed thing actually behaves | seconds, but only after deploy |

Run all four. The first two are so cheap there is no excuse.

```bash
# validity
for f in *.js api/*.js lib/**/*.js; do node --check "$f" || echo "SYNTAX FAIL $f"; done
node --input-type=module --check < esmodule.js     # ES modules: plain --check rejects `import`
node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))"
npx --yes lightningcss-cli@1 --minify style.css -o /dev/null   # exit 0 = valid CSS

# every route still resolves
node -e "['admin','book','order','forms'].forEach(n=>require('./api/'+n+'.js'))"
```

## 2. Offline harness — real Postgres, no Docker, no network

`@electric-sql/pglite` runs genuine Postgres compiled to WASM. This found two real production bugs
that no amount of reading would have.

```js
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
const pool = { query: (sql, params) => params ? db.query(sql, params) : db.exec(sql) };
//                                    ^^^^ exec handles multi-statement DDL
```

```bash
npm install @electric-sql/pglite --no-save
NODE_PATH="$PWD/node_modules" node harness.js "$PWD"
npm uninstall @electric-sql/pglite --no-save && rm -rf node_modules/@electric-sql
```

**The trap:** a memoized `schemaReady` promise in module scope means a second in-process database
reuses the cached promise and **your migrations silently don't run**. Clear the module cache between
scenarios:

```js
delete require.cache[require.resolve('./lib/db.js')];
```

That is a test artifact, not a production bug — one database per process there. Know the difference
before you "fix" it.

**Assert counts, not vibes.** A harness that reports "81 assertions passed" is evidence. One that
reports "looks good" is not.

## 3. Money, auth and data need adversarial cases

For anything financial, the passing path is the least interesting test. The suite must include:

- **Tamper** — client submits a different amount than the server computed → **rejected**
- **Replay** — the same callback delivered twice → **one** paid row, **one** grant
- **Cancel / fail** paths land in the right state
- **A callback error leaves the order recoverable**, not `failed`
- **Unauthenticated** access to every protected endpoint → 401
- **A rotated key invalidates existing sessions**
- **Honeypot** filled → accepted silently, not stored
- **Normalization**: `+880`, `880`, `01…`, dashes all resolve to one canonical value

## 4. Live smoke test after deploy

```bash
B=https://example.com
for u in / /contact /admin; do curl -s -o /dev/null -w "$u %{http_code}\n" $B$u; done
curl -sI $B/ | grep -i content-security-policy
curl -s -o /dev/null -w "%{http_code}\n" -X POST $B/api/track -d '{"page":"x"}' -H 'Content-Type: application/json'  # 204
curl -s -X POST $B/api/consult -d '{"name":"X","email":"bad","message":"hi"}' -H 'Content-Type: application/json'    # 400 + reason
curl -s -o /dev/null -w "%{http_code}\n" $B/api/order-stats     # 401 unauthenticated
curl -s $B/admin | grep -c '<script'                            # 0
```

**A live harness that writes must clean up after itself.** Create a throwaway record, assert against
it, delete everything it made. Then say that it did.

## 5. Tools in this environment that lie

Never use these as evidence:

- **The in-app browser preview pane.** When it is not displayed, `requestAnimationFrame` never fires
  and IntersectionObserver callbacks are never delivered — so every scroll-reveal, lazy-load and
  counter **looks completely broken while being fine.** `getComputedStyle` and `cssRules` return
  stale or impossible values. Screenshots time out on pages with continuous animation. `img.complete`
  reads false while `naturalWidth` is correct.
  → `getBoundingClientRect` **does** work while hidden — that is the reliable way to audit layout.
  → Validate CSS with `lightningcss-cli`, confirm shipped output with `curl`.
- **`vercel domains inspect`** — misreports which project owns a domain.
- **`vercel env pull`** — returns `""` for Sensitive vars. Empty ≠ unset.
- **A local dev server** for anything CSP-related — it sends no CSP headers, so the bug only exists
  in production.
- **A multi-agent verification pass that hit a usage limit.** `confirmedCount: 0` means *verification
  never ran*, not "no bugs". Read `journal.jsonl` in the workflow transcript directory to recover the
  agents that did finish.

## 6. The reporting format

Always two lists. The second one is what makes the first one credible.

```
Verified just now:
  /            200
  /contact     200
  waitlist     accepts a real address; rejects a dead domain with a reason
  greeting     delivered (message id logged)
  admin        0 <script> tags
  offline      81/81 assertions pass

NOT verified:
  live bKash round-trip — needs the owner's merchant sandbox credentials
  PDF rendering — no book file exists yet
```

**Never omit the second list.** A report with no gaps reads as false, and a gap discovered later
costs more than one disclosed now.

If tests fail, say so **with the output**. If a step was skipped, say it was skipped. If it is done
and verified, say so plainly without hedging — earned confidence is the point of doing the work.

## 7. What "done" means

- [ ] Syntax valid across every changed file
- [ ] Regression greps return nothing
- [ ] Logic covered offline, including the adversarial cases
- [ ] Deployed
- [ ] Live smoke test run **against the real URL**
- [ ] Both lists reported — verified, and not verified

Anything less is "I think it works", and that is a different sentence.

## Related

- `responsive-reveal-audit` — measuring layout instead of eyeballing it
- `content-integrity-guard` — the regression greps
- `work-within-usage-limits` — why a truncated verification pass returns a misleading zero

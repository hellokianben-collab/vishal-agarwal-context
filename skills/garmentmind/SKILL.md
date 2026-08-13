---
name: garmentmind
description: >-
  Project context, architecture, and working guide for GarmentMind AI — an L/C &
  export-document discrepancy checker for Bangladesh garment exporters (a
  FastAPI + React + Postgres app, deployed on Vercel, in Desktop/Garment). It
  reads a factory's trade documents (Letter of Credit, commercial invoice,
  packing list, bill of lading, purchase order) and flags every mismatch that
  would get their L/C payment rejected by the bank. Load this whenever the user
  works on GarmentMind, "the garment app", "the document checker", the
  discrepancy engine, garmentmind.vercel.app, extraction providers, the
  wedge/pilot strategy, or anything in the Desktop/Garment folder — it carries
  the mission, architecture, file map, the ~18 discrepancy rules, deploy setup +
  hard constraints, data model, conventions, the honest capability/gap list, the
  roadmap to a reliable v1.0, and the continuity state so a fresh conversation
  resumes without re-deriving anything. Use it even for vague asks like "keep
  building the garment app", "make extraction real", "fix the upload limit",
  "deploy the next version", or "what's left to do".
---

# GarmentMind AI — project context & working guide

GarmentMind is the first product of a would-be AI company: an "AI operations
assistant" for Bangladesh's garment exporters. The shipped wedge is narrow and
deliberate — **catch the document discrepancies that get a Letter-of-Credit
payment rejected, before the bank sees them.** This skill is the durable memory
of how it's built, why, and what's left.

## Identity & locations

| Thing | Value |
|---|---|
| Local path | `C:\Users\Susanta Podder\Desktop\Garment` |
| Live site | https://garmentmind.vercel.app (public, production alias) |
| Vercel team / project | scope `susanta-podders-projects` / project `garmentmind` |
| Git | **Not a git repo.** Deploys are Vercel CLI uploads, not git-push. |
| Demo login | `demo@factory.com` / *(password redacted in the public repo — seeded when `SEED_DEMO=true`, see the local copy)* |
| Current version | **v0.1 — working demo, NOT production-reliable** (see Roadmap) |
| Backend local run | `cd backend && .venv/Scripts/python -m uvicorn app.main:app --port 8000` |
| Frontend local run | `cd frontend && npm run dev` (Vite, port 5173) |
| Full stack local | `docker compose up --build` (includes Postgres) |
| Tests | `cd backend && .venv/Scripts/python -m pytest -q` (15 pass) |

## Why it exists — the business thesis (must not regress)

These were established by a ruthless-investor evaluation. Do not drift back to
the naïve framing.

- **The labor-savings pitch is DEAD here.** Bangladesh labor is ~$1–2/hr; a
  merchandiser is ~$150–400/mo. "Save hours of data entry" is worth almost
  nothing. Automating cheap labor is a weak ROI story.
- **Sell ERROR PREVENTION + CASHFLOW, not time.** The money is in stopping
  costly failures: an over-drawn invoice, a late shipment, a quantity/price gap,
  a description mismatch — each can delay or block payment on a large shipment
  under **UCP 600** (the bank rules for examining L/C document presentations), or
  trigger a $10k–100k+ buyer chargeback. That is the value proposition.
- **Moat is NOT the AI.** Extraction is a commodity (anyone can call Claude).
  The moat is the **garment-export + L/C domain rules engine**, plus workflow,
  trust, and factory relationships.
- **Strategy = wedge → prove willingness to pay → expand.** Build the thinnest
  thing (this discrepancy checker), get 3 factories to run REAL documents, charge
  money. Only expand to the broader "AI OS" (chat, analytics, workflows) if they
  pay. Do NOT build the 9-phase cathedral speculatively.
- Investor rating of the idea: **~6/10 blended** — real problem, thin moat,
  weak willingness-to-pay in-market, must be narrowed to the error-prevention
  wedge to be worth building.

## What it does today (v0.1 capabilities)

**Working + tested:**
- Upload a *set* of related trade documents (or run built-in samples) → each is
  turned into a canonical `ExtractedDocument` → a rule engine cross-checks them →
  a severity-ranked report (headline pass/fail, per-document conflicting values,
  UCP-600 consequence + fix per finding).
- The **discrepancy engine** — ~18 UCP-600-grounded rules (the crown jewel). 5
  unit tests: clean set → 0 findings; dirty set → all seeded discrepancies caught.
- **Auth** (register company + JWT login + Argon2id), **multi-tenant** isolation
  (`company_id` on every table; a company cannot read another's reports — a
  passing automated test), report persistence, list/fetch history.
- **React UI**: login/register, dashboard (sample demo + recent checks), upload
  page, report view, and a right-edge **"Instructions"** slide-in drawer.
- Deployed live on Vercel; 15/15 backend tests green; `ruff` clean.

**NOT real yet (the honest gaps):**
- **Extraction is MOCK.** The default provider returns fixture data keyed off
  the *filename* — it does NOT read real PDFs. The Claude adapter
  (`claude_provider.py`) is written but **has never been run once with a real
  key or a real document.** Untested code.
- **Database is throwaway.** On Vercel it's `/tmp` SQLite → resets on cold
  starts, not shared across serverless instances. Demo-only.
- **Rules tuned on synthetic samples**, never on a real factory L/C. Tolerances
  and fuzzy-match thresholds will need tuning against real documents.
- **No independent audit** of the money-critical logic yet (the adversarial
  review workflow was killed by a usage limit before it ran).

## Architecture (Clean Architecture)

```
API (FastAPI routers)  →  Services  →  Domain (extraction + discrepancy engine)  →  DB
                                        └─ StoragePort (local / S3)
```
Endpoints hold no business logic and never touch the DB directly. The
discrepancy engine only ever sees the canonical `ExtractedDocument` — never a
raw PDF or provider JSON. That decoupling is why the AI provider and the
database can be swapped without touching the rules. Full write-up:
`docs/ARCHITECTURE.md`.

## The discrepancy engine — the moat

`backend/app/domain/discrepancy/`. Each rule is `(RuleContext) -> list[Finding]`,
fires only when its required fields are present (missing data must never yield a
false positive), and maps severity to a real consequence. Registered in
`rules.py :: ALL_RULES`. Severity gate: a set "passes" only with **no CRITICAL
and no HIGH** findings.

| Code | Checks | Severity |
|---|---|---|
| R001 | Currency consistent across docs | critical |
| R002 | Invoice ≤ L/C amount (+ tolerance) — over-drawing | critical |
| R003 | Invoice arithmetic (line qty×price=amount; sum=total) | high |
| R004 | Total quantity consistent (invoice/packing/PO), UCP 30(b) ±5% | critical/medium |
| R005 | Goods description corresponds with L/C (fuzzy) | high/medium |
| R006 | Incoterm consistent | high |
| R007 | Beneficiary (exporter) matches L/C | high |
| R008 | Applicant (buyer) matches L/C | high |
| R009 | Shipment date ≤ L/C latest shipment date | critical |
| R010 | Documents dated within L/C expiry | critical |
| R011 | Ports of loading/discharge match L/C | high |
| R012 | PO number consistent | medium |
| R013 | Gross weight: packing list vs B/L | medium |
| R014 | Carton count: packing list vs B/L | medium |
| R015 | Unit price: invoice vs PO | high |
| R016 | HS code present on invoice lines | low |
| R017 | Country of origin consistent | medium |
| R018 | All L/C-required documents present | high |
| R019 | Low extraction confidence → human review | info |

Helpers in `normalize.py` (currency aliases, fuzzy name/description match via
`difflib`, decimal/percent parsing, date compares) make comparisons robust so
the engine flags real problems, not formatting noise. `engine.py` runs each rule
in isolation (a raised rule is logged + skipped, never crashes the report),
sorts findings most-severe-first, computes the summary.

## Extraction — provider-agnostic

`backend/app/domain/extraction/`. `ExtractionProvider` ABC + factory
`get_extraction_provider(settings)` selected by env `EXTRACTION_PROVIDER`:
- `mock` (`mock_provider.py`) → deterministic fixtures from `samples.py`, keyed
  off filename keywords (+ "dirty"/"bad" → the discrepant set). Offline, no key.
- `claude` (`claude_provider.py`) → real Claude (`anthropic` SDK). Sends the
  PDF/image as a base64 content block + a strict JSON-only prompt
  (`base.py :: EXTRACTION_SYSTEM_PROMPT`) + the `ExtractedDocument` JSON schema,
  then `model_validate`s defensively (bad output → low-confidence UNKNOWN, never
  a crash). Model default `claude-opus-4-8` (accuracy-critical; env can drop to
  `claude-sonnet-5` for cost). **Never exercised against a real document yet.**

## File map

**Backend** (`backend/app/`):
| Path | Role |
|---|---|
| `core/config.py` | `Settings` (pydantic-settings); coerces `postgres://`→asyncpg; `get_settings()` cached |
| `core/security.py` | Argon2id hash/verify + JWT encode/decode |
| `core/uploads.py` | magic-byte + size validation; virus-scan hook (no-op) |
| `core/logging.py` / `core/rate_limit.py` / `core/exceptions.py` | JSON logs / login limiter / `AppError` hierarchy |
| `domain/documents/schemas.py` | `ExtractedDocument`, `LineItem`, `DocumentType` (the canonical shape) |
| `domain/extraction/*` | provider ABC + mock + claude + factory |
| `domain/discrepancy/*` | `models.py`, `normalize.py`, `rules.py`, `engine.py` |
| `domain/samples.py` | clean/dirty fixtures + `mock_document_for` |
| `db/base.py` | `Base` + mixins (UUID pk, created/updated, soft delete, `TenantMixin`) |
| `db/models.py` | `Company`, `User`, `DocumentSet`, `DocumentRecord`, `AnalysisReport`, `UserRole` |
| `db/session.py` | async engine, `get_session`, `init_db` (create_all) |
| `services/auth_service.py` / `services/analysis_service.py` | business logic (`analyze_uploads`, `run_sample`, `get_report`, tenant-scoped) |
| `storage/*` | `StoragePort` + `LocalStorage` (S3 impl is the deferred prod path) |
| `api/deps.py` | `get_current_user`, `CurrentUser`, `SessionDep`, `SettingsDep`, `require_role` |
| `api/errors.py` | exception handlers → `{"error":{code,message,details}}` envelope |
| `api/v1/routers/*` | `health`, `auth`, `documents` (analyze/list/get), `samples` |
| `main.py` | app factory, request-id middleware, lifespan (init+seed, guarded), `seed_demo` |
| `tests/*` | `test_discrepancy_engine.py` (5), `test_api.py` (10 incl. tenant isolation) |

**Frontend** (`frontend/src/`): `lib/api.ts` (fetch client, `ApiError`, token in
localStorage), `auth/AuthContext.tsx`, `components/` (`Layout`, `ProtectedRoute`,
`SeverityBadge`+`PassBadge`, `ReportView`, `HelpDrawer` = the Instructions
button), `pages/` (`Login`, `Register`, `Dashboard`, `Analyze`, `Report`),
`types.ts`. Design tokens in `tailwind.config.js` (`brand.*` navy/accent + `sev.*`
severity colors); Plus Jakarta Sans. Design system doc: `docs/design-system.md`.

**Root / deploy:** `vercel.json` (build frontend + route `/api`,`/health` to the
Python function + SPA fallback), `api/index.py` (Vercel serverless entry: adds
`backend/` to path, exposes `app`, bootstraps DB at cold start since Vercel may
not run ASGI lifespan), root `requirements.txt` (serverless deps) + `package.json`
(build script), `docker-compose.yml` (Postgres+API+frontend), `render.yaml`
(Render blueprint alt), `DEPLOY.md`, `README.md`, `Makefile`.

## Data model (pilot subset)

`companies` (tenant root) · `users` (role: super_admin/company_admin/manager/
employee; Argon2 hash; email globally unique for unambiguous login) ·
`document_sets` · `document_records` (extracted JSON, checksum, storage key,
type, confidence) · `analysis_reports` (passed, headline, counts/documents/
findings as JSON). All carry UUID pk + created/updated + soft delete via mixins,
and `company_id` (tenant). Tables auto-create on boot (`init_db`); **no Alembic
yet** (deferred).

## Deploy

Live on Vercel as ONE project: static frontend + FastAPI as a Python serverless
function under `/api`. Redeploy: `cd Desktop/Garment && vercel deploy -y` (already
linked to project `garmentmind`; add `-e KEY=val` for env). Preview by default;
`--prod` promotes. `DATABASE_URL` auto-coerces `postgres://`→asyncpg, so a Neon/
Vercel Postgres URL drops in cleanly. Full guide + Render/Railway/VPS options:
`DEPLOY.md`.

### ⚠️ Hard Vercel constraints that BLOCK real extraction (must design around)
- **~4.5 MB request body cap** on serverless functions. Five real PDFs blow past
  it → uploads will fail. Real uploads need direct-to-storage (presigned upload)
  or a non-serverless backend.
- **Function timeout** (Hobby 60s; Pro higher). Real Claude extraction of ~5 docs
  is ~50–150s sequential → times out. Real extraction needs a **background job /
  queue**, or a container backend (Railway/Render/Fly) with Vercel serving only
  the frontend.
- **`/tmp` SQLite is ephemeral.** Persistence needs managed Postgres (Neon /
  Vercel Postgres) via `DATABASE_URL` + redeploy.

These three are the architectural fork for v1.0 — decide the backend home before
building "reliable" extraction.

## Conventions / must-not-regress

- Endpoints never contain business logic or raw DB calls — go through services.
- Every tenant-scoped query filters `company_id` (derived from the auth'd user,
  never client input). Never weaken this — it's the tenant-isolation guarantee.
- New tables inherit the `db/base.py` mixins (UUID/timestamps/soft-delete/tenant).
- A rule must not fire on missing data (no false positives). Severity maps to a
  real consequence; include a plain-English explanation + UCP reference + fix.
- Extraction failures degrade to low-confidence UNKNOWN, never a crash.
- Secrets only via env; `.env` git-ignored; `JWT_SECRET` must be long/random.
- Keep `ruff` clean (line-length 120) and the 15 tests green before any deploy.

## Desired work process (how to build toward v1.0)

The user's constraint is **usage limits**, and the method must survive a limit
hitting mid-work. Rules:

1. **I cannot measure remaining usage limit** — no tool exists for it; I only
   learn of it when a call fails. Do NOT invent a number or try to "size a
   portion to fit the remaining limit." Instead make the limit not matter:
2. **Atomic portions.** Each portion ends in a committed-good state: **tests
   green + (if shippable) deployed + version tagged**. If the limit dies
   mid-portion, nothing is broken — just redo that one portion.
3. **Update the continuity state** (below) at the end of every portion so the
   next session resumes with zero re-derivation.
4. **Small portions by default** — assume the limit can hit any time.
5. **Ultracode OFF for this work.** Spawning agent fleets is ~10x usage and
   directly fights the usage-conservation goal; the builder holds full context
   anyway. Solo unless a task genuinely needs parallel independent coverage.
6. **Version on deploy.** When a batch of portions stacks into something
   shippable, deploy and tag it (v0.2, v0.3, …). Record the version + live URL
   here.

## Roadmap to a reliable v1.0 (the gates)

Ordered by what makes it *actually work*, not what's easy:
1. **Backend architecture decision** (unblocks everything): move the API to a
   container host (Railway/Render/Fly) OR add presigned-upload + a background
   worker on Vercel. Required for real multi-PDF uploads + long extraction.
2. **Managed Postgres** (Neon/Vercel) wired via `DATABASE_URL` → real persistence.
3. **Make extraction real**: run `claude_provider.py` against real PDFs with a
   key; fix whatever breaks (it has never run). Add extraction tests.
4. **Tune the rules on real documents**: adjust tolerances + fuzzy thresholds
   against actual factory L/Cs; add regression fixtures from real cases.
5. **Human-in-the-loop review UI**: let a merchandiser see + correct extracted
   fields before/after the check (trust + a data flywheel).
6. **Adversarial review** of the money-critical logic (the workflow that never
   ran) + hardening: refresh-token rotation, Postgres RLS, Alembic, real virus
   scan, rate-limit the analyze endpoint, self-host fonts.
7. Then (only if factories pay): the broader vision — cross-document intelligence
   report, RAG chat over documents, analytics, workflow automation.

## Continuity state — READ FIRST when resuming

- **Version:** v0.1 (demo). Live: https://garmentmind.vercel.app
- **Provider:** `mock` (no real extraction). **DB:** `/tmp` SQLite (ephemeral).
- **NEXT PORTION (proposed):** Gate 1 — decide + implement the backend home so
  real uploads + real extraction can work. This is a design fork; confirm the
  host with the user before building (container backend vs. Vercel + worker).
- Blocked-on-user items: an `ANTHROPIC_API_KEY` (for Gate 3), a managed Postgres
  connection string (Gate 2), and the Gate-1 host choice.
- **When you finish a portion:** update this section (version, what changed,
  new NEXT PORTION) and, if shipped, the version + live URL above.

## References (in-repo docs — read for exhaustive detail)
`README.md` (run + overview) · `docs/ARCHITECTURE.md` (layers + request flow) ·
`DEPLOY.md` (all deploy paths + env) · `docs/design-system.md` (frontend tokens)
· the approved wedge plan at
`~/.claude/plans/project-codename-garmentmind-partitioned-anchor.md`. For generic
Vercel-serverless mechanics, the companion skill `vercel-node-serverless` (note:
that one is Node/Express; this backend is Python/FastAPI, so its serverless
*traps* apply but its code patterns do not).

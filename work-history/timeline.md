# Build timeline — 3 June to 13 August 2026

Reconstructed from **83 session transcripts / ~363 requests** across 10 project directories, plus
the skill and memory files written along the way. Dates are the dates of the sessions themselves.

Read this to understand *how the capability grew*, not just what exists. The arc is: learning to
deploy → building sites → extracting reusable skills → building tools with real domain value →
building autonomous agents.

---

## June 2026 — learning the pipeline

**3 Jun** — First personal website attempt. Next.js. The session is mostly infrastructure literacy:
why `.next`, `.claude` and `node_modules` don't belong in a git repo, how to deploy from Vercel, how
to make a site live at all. Two GitHub repos date from here (`Vishal-Agarwal-personal-website`,
`wb`).

**4 Jun** — Decisive stack change: *"I want the codes like a normal website using html css and js
and for backend node js."* Rewritten into `Final web vishal`. Also: "leave space for 3d model" — the
3D ambition is there from week one. Complex features (payments, scheduling agent) deliberately
deferred.

**8 Jun** — *"think and suggest what customizations do i need to do in claude code to create fully
deployable modern websites."* This is the pivot from "build me a site" to **"upgrade the tool that
builds sites"**. `ui-ux-pro-max` installed, design references gathered (sidewave.it), first
`vishal-portfolio` Vercel deploy — which immediately 404'd and had to be debugged.

**10 Jun** — `caveman` plugin installed and set to maximum. Terse mode has been on ever since.

**11–13 Jun** — The `Vishal web trial 4` hero sprint. Iterative, visual, fast: hero layout from a
photo, rotating 3D pyramid behind the name, glassmorphic glow (added, then *"eliminate the glow"*), a
scroll-driven zoom-out that lands the page inside a laptop screen, light-mode toggle, Pinterest and
21st.dev pulled for inspiration, click ripple. `emil-design-eng`, `impeccable` and `taste-skill`
installed mid-sprint. Shipped to production.

Also 12 Jun, the instruction that defines the working relationship:
> *"now start building **i want you to fullfill my role as well**. find bugs or misalignments
> mistakes then fix them"*

**19 Jun** — *"Compress our conversation inside a skill."* Repeated across five sessions in one day.
This is the origin of the whole skills library — the realization that the expensive part is not the
code, it is the context, and context should be written down once and reloaded. `vercel-labs/skills`
installed the same day.

---

## July 2026 — from websites to products

**8–9 Jul** — Working under an explicit token budget (*"token limit is 30k"*). `find-skills` used to
go shopping for capability. **invoice-assistant** started: an AI invoice-processing service briefed
as *"Senior AI Software Engineer and Solutions Architect… think like a CTO"* — FastAPI + Docker.

**11 Jul** — **KiAnben** goes live. An existing GitHub repo deployed to Vercel, then
`kianben.com` connected. Immediately: *"why does the vercel website look like that? Fix that."* —
the classic serverless static-asset 404. Then the book shop is specified: bKash + Nagad, delivery
charge, real content. Neon Postgres connection string handed over.

**12 Jul** — The **sign-in bug**: logins worked, then stopped an hour later. Root cause: JSON-file
writes on an ephemeral serverless filesystem. Fixed with dual-mode store adapters (JSON local,
Postgres in production, identical method names). This one bug became the `vercel-node-serverless`
skill. `21st` MCP installed.

Same day — **GarmentMind AI** begins, briefed as *"You are my Technical Co-Founder, Lead AI
Engineer, Product Manager, and Software Architect… This is NOT a demo project."* And then,
crucially, before building:

> *"You are a Garment business owner and an expert investor who has 30+ years of business
> experience… **Evaluate this idea of mine like a ruthless investor.**"*

The review killed the labor-savings pitch, rated the idea ~6/10, and forced the narrow
error-prevention wedge. He accepted it and adjusted strategy the same session.

**13–14 Jul** — GarmentMind deployed with a database and an instructions drawer. On KiAnben, the
hero animation request → 2D canvas shipped → **disappointment**. That feedback becomes a permanent
rule (`work-boldly-when-authorized`).

**15 Jul** — `vishal-portfolio` domain broken and fixed; full responsive pass; then a **Claude
Design** export imported via the DesignSync MCP as the basis for a completely new site.

**16 Jul** — The new `iamvishalagarwal.com` goes live. Waitlist + Resend greeting emails. Then the
owner-correction pass that still governs every edit: Vishal not Bishal, 28+ not 1,000, 4+ years,
*Prothom Container*, English only, "Cement" with no brand name. Real book cover and Facebook reels
added.

**26 Jul** — Higgsfield MCP + skills installed for image/video generation. The scoping rule is made
permanent: *"make it global. and from now on always make me remember to make tools global."*
Portrait cutouts produced **locally and free** rather than burning generation credits. Site made
device-friendly.

**27 Jul** — GarmentMind compressed into a skill, with an explicit ask for the differentiation
story. Mobile text-overlap fixed. bKash merchant account planned.

**28 Jul** — Heavy day. bKash PGW sandbox wired end to end. **The admin login saga** begins: three
successive client-side builds all fail silently in his Chrome. City combobox (570 BD locations),
privacy-preserving visitor tracking, admin stats. HeyGen MCP added; 21st and HeyGen moved to user
scope. In parallel, he writes the **BDT global settlement network** proposal and asks for it to be
attacked.

**29–30 Jul** — Proposal judged. **Admin v4: `admin.js` deleted entirely, `/admin` server-rendered,
zero JavaScript — and it works.** The 12-function Hobby cap hits and forces the router
consolidation (16 → 4). Ebook delivery + reading analytics built (grants, per-device reader
identity, visibility-gated heartbeats, a real "finished" definition). Consultations booking + owner
panel replaces a form that had been notifying nobody — **8 real enquiries were sitting unread going
back to 22 July.**

Also 30 Jul: *"I want you to make me a tool that can help me… Build something meaningful. Not just
something to pass by me… **So your reputation depends on it.**"* → the **landed-cost calculator**.
Scored **8.5/10**.

**31 Jul** — Landed gets the real thing: **7,465 HS codes from the FY2026-27 Operative Tariff**,
lookup, search, override flow. `/community` with member accounts and saved calculations. And he
designs the admin **access hierarchy** himself:

> *"only one device can have the access to the master admin panel but if something happens with that
> device there is no visit for 15 days straight, the access goes to the next determined Gmail by
> default."*

---

## August 2026 — autonomous agents

**1 Aug** — `garmentmind.iamvishalagarwal.com` live. Community page rebuilt with 3D and motion. And
a scope correction that stuck: a WebGL hero redesign of the *main* site was reverted because it was
never asked for.

**2–3 Aug** — The biggest architectural build.

> *"I would like to learn how can i create an ai agent to monitor my social media platforms… I dont
> know anything about how to build agent. But, I would prefer your instruction to learn it. And I
> would like to learn as i build that agent."*

The **social media agent**: six specialist micro-agents (design, copy, analyst, meta, strategy,
critic) that are woken by events and sleep otherwise, a manager, a `playbook.md` / `learned.md`
knowledge base, and — his own idea, refined —

> *"it watches whether you took its advice, without you telling it. Perceptual hash on thumbnails,
> string diff on titles… snapshots 7 days before/after, writes verdict: worked / no effect /
> backfired. **That verdict is the training signal.**"*

Facebook and Instagram agents added, unified dashboard deployed to Vercel, Telegram `/fix` `/skip`
control, and a password-gated **web** control path built on a private Blob queue (no tunnel).

**5 Aug** — *"I permit you to do these things i don't want to do it… you are allowed to command my
desktop. finish it and check everything once. then monitor my pages."* Full delegation.

**6–13 Aug** — The agent runs on schedule: daily analyst briefings, weekly critic passes that delete
unsupported claims, research agents keeping specialist knowledge current.

**12 Aug** — A code-review-and-fix pass on KiAnben under a very specific role brief (*"elite website
builder… your main expertise are finding bugs in already built websites and fixing them"*), deployed.
`OpenMontage` cloned and set up. Then a new ask:

> *"create an agent that will create a youtube channel, then constantly create content on it's own…
> schedule 1 video each day… using free ai tools… ultimately growing that channel to 1 million
> subscribers"*

**13 Aug** — This repository.

---

## What the arc actually shows

1. **Ten weeks from "how do I make a website live" to designing multi-agent systems with their own
   training signal.** The learning curve here is the story.
2. **Context is treated as the asset.** The "compress this into a skill" instinct appeared in week
   three and never stopped. That is why this repo can exist at all.
3. **Corrections stick.** Every rule in `profile/01-how-i-work.md` traces to one specific moment.
4. **He tests his own ideas adversarially** — and then acts on the result, including when the
   verdict is "your pitch is dead".
5. **The products are increasingly about other people.** The portfolio was for him; the calculator,
   the discrepancy checker and the community are for an audience of Bangladeshi traders.

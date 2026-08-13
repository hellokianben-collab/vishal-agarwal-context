---
name: personal-mentor-website
description: Build a personal brand / mentorship / coach / consultant website with owner-self-managed content (achievements, goals with task-progress, videos) via a password admin panel, a dark+gold animated hero with a 3D-model slot, social links, and optional booking + Bkash payments. Two stacks — simple (HTML/CSS/JS + Node/Express + JSON file) or full (Next.js + Prisma/Postgres + Cloudinary). Use when building or extending a personal/portfolio/mentorship site with an owner-editable content panel, visibility eye-toggles, calendar booking, or Bkash payment flow.
---

# Personal / Mentorship Website Builder

Playbook distilled from building Vishal Agarwal's mentorship site (two versions).
Goal: a premium personal-brand site where the owner manages all content themselves
through an admin panel — "Facebook-style posting, but custom."

## 0. Ask first (only if unclear)
Blocking forks worth one batched question: (1) stack — simple vs full, (2) payment —
none / manual Bkash TrxID / Bkash PGW API, (3) booking — none / form / calendar slots,
(4) media storage — JSON+local / Cloudinary / DB. Pick sensible defaults and state them
rather than over-asking.

## 1. Pick the stack
- **Simple** (default for "normal website html css js + node backend"): static HTML/CSS/JS
  front end, Node + Express back end, content in `data.json` (no DB), uploads to `/uploads`,
  single-password cookie auth. Runs with `npm start`. Best when user wants something they can
  read/run easily, no payment/scheduling.
- **Full**: Next.js 14 App Router + TS + Tailwind + shadcn + framer-motion + react-three-fiber
  + Prisma/Postgres + Cloudinary + jose JWT. Deploys to Railway. Use when they need real
  database, bookings, payments, scale.

Match the user's words. "Like a normal website with html css js" → simple. Don't over-engineer.

## 2. Core features (both stacks)
- **Hero** with a 3D-model slot. Until a real `.glb` exists, show the owner's photo (full stack
  also has an animated r3f placeholder). Mark the slot (`data-model-slot="true"`) so it's
  swappable later.
- **About** — name, tagline, bio, photo, derived stat chips.
- **Achievements / Work** — owner CRUD, photo/video, **eye-toggle visibility top-right of each card**.
- **Goals** — owner CRUD + tasks; ticking tasks drives a live progress bar; visibility toggle.
- **Videos** — YouTube links (embed via extracted ID) or uploaded files; visibility toggle.
- **Social links** + contact (email/WhatsApp). **Footer**.
- **Admin panel** — login, the CRUD above, settings (hero text, photos, socials, payment),
  password change. Each manageable item has the visibility eye-toggle.

## 3. Design system (the look)
- Dark + gold: bg `#050505`/`#0a0a0a`, card `#0f0f10`, border `rgba(255,255,255,.1)`,
  text `#f5f5f5`, muted `#9a9a9a`, gold `#d4af37` / soft `#e9c767`. Font: Inter.
- **Merged hero** = elegant floating blurred shapes (rotated gradient pills) + faint animated
  SVG "floating paths" + per-letter title reveal + gold gradient on the 2nd title line +
  ambient radial gradient wash. Two columns: copy left, visual/3D right; stacks on mobile.
- Reveal-on-scroll via IntersectionObserver (simple) or framer-motion `whileInView` (full).
- Subtle mouse-tilt on the hero visual frame.

## 4. Honest limits — state these up front (owner preference: no crappy work)
- **Cannot generate AI images** of the person. Use their real supplied photos instead (better).
- **Cannot scrape FB/IG/YouTube** photos (login-walled). Owner supplies image files.
- **Cannot make a photoreal 3D model.** Real path: owner runs photos through meshy.ai /
  lumalabs.ai / Hyper3D Rodin → exports `.glb` → uploads it; you wire the viewer/slot.
- **Cannot save chat-attached images to disk** (no file bytes). Reference expected paths
  (e.g. `assets/vishal-1.jpg`) with a clean fallback; tell owner to drop the files in.

## 5. Build order
Config → data model/seed → backend (auth, content API, upload) → design tokens/CSS →
hero + 3D → public sections → admin panel → deploy files → `npm install` + build/run smoke test.
Track with a task list for the full stack (it's ~70 files).

## 6. Verify before claiming done
`npm install`, then build (`next build`) or start the server. Smoke-test with curl: home 200,
content API returns seed, admin route 401 without cookie, login sets cookie → admin API 200,
one CRUD create. If no local DB (full stack), confirm the only failure is the DB connection.

See `reference.md` for: exact env vars, gotchas hit, the simple-stack file map + key snippets,
deploy steps (Railway / Vercel), and Vishal's concrete details.

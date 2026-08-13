---
name: ship-modern-3d-site
description: Build and deploy a modern 3D/motion website end-to-end — Next.js (App Router) + TypeScript + Tailwind v4 + react-three-fiber + drei + motion (Framer) + Lenis, shipped to Vercel. Use when the user wants a "modern website", "3D hero", "scroll animations / parallax reveals", a "portfolio / landing page with motion", a three.js/R3F site, or asks to deploy such a site to Vercel. Covers project setup, the component/animation patterns, local verification, and the Vercel deploy gotchas.
metadata:
  author: vishal
  version: "1.0.0"
---

# Ship a Modern 3D / Motion Site

Build a fast, accessible, animated Next.js site (3D hero, scroll reveals, smooth scroll) and get it live on Vercel — without re-hitting the traps that eat hours. This skill is the compressed end-to-end pipeline: **Setup → Scaffold → Build → Verify → Deploy.**

Read the relevant reference file for each phase. The deploy file is the highest-value one — it documents non-obvious failures (401 protection, `framework:null` → 404, stray GitHub auto-connect) that look like "the site is broken" but are config.

## Stack (don't swap without asking)

| Layer           | Choice                                               | Version proven                            |
| --------------- | ---------------------------------------------------- | ----------------------------------------- |
| Framework       | Next.js (App Router) + TypeScript                    | `next` 16.2.7, `react`/`react-dom` 19.2.4 |
| Styling         | Tailwind CSS v4                                      | `tailwindcss` 4 (`@tailwindcss/postcss`)  |
| Components      | shadcn/ui (Radix + Tailwind)                         | add as needed                             |
| 3D              | `three` + `@react-three/fiber` + `@react-three/drei` | fiber 9.6.1, drei 10.7.7, three 0.184.0   |
| Motion          | `motion` (Framer) + `gsap` + `lenis`                 | motion 12.40.0, gsap 3.15.0, lenis 1.3.23 |
| Icons           | `lucide-react`                                       | latest                                    |
| Deploy          | Vercel                                               | CLI 54.x                                  |
| Package manager | npm                                                  | —                                         |

> R3F v9 + drei v10 are the React-19-compatible majors. On React 19 / Next 16, install `@react-three/fiber@latest @react-three/drei@latest` (don't pin to v8/v9-of-drei).

## Workflow

| Phase       | Do                                                                                      | Reference                                                          |
| ----------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1. Setup    | CLAUDE.md stack rules, `.claude/settings.json` allowlist + prettier hook, `launch.json` | [reference/claude-code-setup.md](reference/claude-code-setup.md)   |
| 2. Scaffold | `create-next-app` (watch the folder-name trap), add 3D/motion deps                      | [reference/stack-and-patterns.md](reference/stack-and-patterns.md) |
| 3. Build    | Tailwind v4 tokens, fonts, `content.ts` SSOT, the component/animation patterns          | [reference/stack-and-patterns.md](reference/stack-and-patterns.md) |
| 4. Verify   | Preview MCP loop + the `.next` cache and Lenis/headless-screenshot gotchas              | [reference/verify-local.md](reference/verify-local.md)             |
| 5. Deploy   | Vercel CLI playbook — every gotcha + exact commands                                     | [reference/deploy-vercel.md](reference/deploy-vercel.md)           |

## Hard rules (non-negotiable)

- **Reduced motion:** every animation and the 3D canvas must respect `prefers-reduced-motion`. Gate motion with `useReducedMotion()`; render a static frame for 3D.
- **3D is heavy:** load R3F canvases with `dynamic(() => import(...), { ssr: false })`, wrap in `<Suspense>`, lazy-load models/textures, and **pause the frameloop when the canvas is offscreen** (perf + it unblocks headless screenshots — see verify-local).
- **Accessibility:** semantic HTML, real heading hierarchy (every `<section>` has an `<h2>` — never a styled `<p>` as the title), visible focus rings, alt text, WCAG AA contrast.
- **No layout shift:** reserve space for media/canvases/embeds (fixed min-heights).
- **Mobile-first**, dark mode by default, test 360px → 1440px. Target Lighthouse mobile perf ≥ 90.
- **Content lives in one file** (`src/lib/content.ts`) — components read only from it, so editing the site = editing one file.

## Related skills

`bold-hero-section` (filled+outlined editorial hero, Clash Display) and `personal-mentor-website` (mentorship site with admin panel) cover specific visual builds. This skill is the surrounding pipeline + deploy operations.

# Phase 1 — Claude Code setup

Get the session into a state where the agent defaults to the right stack, edits stay formatted, and common commands don't prompt. All of this is project-local under the repo.

## CLAUDE.md (project root)

Pin the stack + rules so every session defaults correctly. Keep `@AGENTS.md` as the first line (create-next-app generates an `AGENTS.md` with a Next-version note).

```markdown
@AGENTS.md

# Project: Modern 3D/Motion Websites

## Stack (do not swap without asking)

- Framework: Next.js (App Router) + TypeScript
- Styling: Tailwind CSS v4
- Components: shadcn/ui (Radix + Tailwind)
- 3D: three + @react-three/fiber + @react-three/drei
- Motion: motion (Framer Motion), gsap, lenis (smooth scroll)
- Deploy: Vercel · Package manager: npm

## Hard rules

- Accessibility: semantic HTML, focus states, alt text, WCAG AA.
- Reduced motion: every animation respects prefers-reduced-motion; gate 3D/heavy motion behind it.
- Performance: dynamic(ssr:false) for R3F canvases; wrap 3D in <Suspense>; transform/opacity only; Lighthouse ≥90 mobile.
- No layout shift: reserve space for media and canvases.

## Commands

- npm run dev — local dev (Turbopack)
- npm run build — must pass before deploy
- npm run lint
```

> **Gotcha — CLAUDE.md clobber.** `create-next-app` generates its own `CLAUDE.md` (just `@AGENTS.md`) plus `AGENTS.md`. If you scaffold into a subdir and `mv` files up, that generated CLAUDE.md **overwrites** yours. So: scaffold FIRST, then write CLAUDE.md, keeping `@AGENTS.md` on line 1.

## .claude/settings.json

Permission allowlist + prettier-on-edit hook (team-shareable, commit this):

```json
{
  "permissions": {
    "allow": [
      "Bash(npm install)",
      "Bash(npm install:*)",
      "Bash(npm ci)",
      "Bash(npm run:*)",
      "Bash(npm run build)",
      "Bash(npm run dev)",
      "Bash(npm run lint)",
      "Bash(npx:*)",
      "Bash(npx shadcn:*)",
      "Bash(npx prettier:*)",
      "Bash(npx tsc:*)",
      "Bash(npx vercel:*)",
      "Bash(vercel:*)",
      "Bash(git:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/format.mjs" }
        ]
      }
    ]
  }
}
```

> Use a **relative** path (`node .claude/hooks/format.mjs`) so it works regardless of OS — hook cwd is the project root. The harness re-writes `.claude/settings.local.json` with whatever permissions get accepted during the session; leave that file alone and keep team config in `settings.json`.

## .claude/hooks/format.mjs

Reads the hook payload from stdin, prettifies the edited file, fails silently so a missing prettier or unformattable file never blocks an edit:

```javascript
import { execSync } from "node:child_process";

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    const file = JSON.parse(raw)?.tool_input?.file_path;
    if (!file) return;
    if (!/\.(ts|tsx|js|jsx|mjs|cjs|css|scss|json|md|mdx|html)$/i.test(file))
      return;
    execSync(`npx prettier --write "${file}"`, { stdio: "ignore" });
  } catch {
    // never break the edit on a formatting failure
  }
});
```

Install prettier for the hook to do anything: `npm install -D prettier prettier-plugin-tailwindcss`, plus a `.prettierrc` that lists `"plugins": ["prettier-plugin-tailwindcss"]` (auto-sorts Tailwind classes).

## .claude/launch.json (for Preview MCP)

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "web",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 3000
    }
  ]
}
```

## Global vs project scope (worth knowing)

- npm deps are always per-project (`node_modules/`) — never global. CLAUDE.md records the list so any new project re-installs fast.
- The config above is project-local. To make it apply to _every_ future project, move stack-agnostic bits (allowlist, format hook) to `~/.claude/`; keep stack-specific CLAUDE.md rules per-project (a global CLAUDE.md would bleed Next.js rules into non-web repos).

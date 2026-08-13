# Phase 4 — Verify locally

## Preview MCP loop

1. `preview_start` (reads `.claude/launch.json` → runs `npm run dev`, port 3000).
2. `preview_screenshot` for layout, `preview_console_logs` (level: error) for runtime errors, `preview_eval` for DOM/state inspection, `preview_resize` for responsive/mobile.
3. Fix source → re-check. `preview_stop` when done.

## Gotcha: stale Turbopack dev cache

After big `globals.css` / `layout.tsx` edits (tokens, fonts), the dev server can keep serving **old compiled CSS** — `bg-accent` etc. look unapplied, the page renders with the previous theme. The tell-tale: `getComputedStyle(document.documentElement).getPropertyValue('--accent')` is empty / background is a stale color.

Fix:

```bash
# stop the preview server, then:
rm -rf .next
# restart preview_start
```

## Gotcha: headless screenshot times out

A continuous R3F frameloop **and** Lenis keep the page from ever reaching "idle", so `preview_screenshot` can hang/timeout (especially once scrolled). Three mitigations:

- **`?still=1`** — load `http://localhost:3000/?still=1`; `HeroObject` switches `frameloop` to `"demand"` (one static frame) → page idles → capture works. (Also doubles as a reduced-motion-equivalent preview.)
- **Offscreen pause** — the IntersectionObserver frameloop pause (see stack-and-patterns) stops the canvas when the hero scrolls away.
- **`npm run build` is the authoritative check.** It compiles, type-checks, and prerenders — green build = the app is correct even when screenshots are flaky. Treat capture timeouts as a tooling artifact, not a site bug (confirm via console_logs showing no errors + a green build).

## Gotcha: Lenis vs programmatic scroll

Lenis transforms the scroll container, so `getBoundingClientRect().top` drifts and `el.scrollIntoView()` is intercepted/animated. For deterministic scroll in `preview_eval`, use cumulative `offsetTop` (layout-based, transform-immune):

```js
let y = 0,
  el = document.getElementById("section-id");
while (el) {
  y += el.offsetTop;
  el = el.offsetParent;
}
window.scrollTo(0, y - 70);
```

Even then Lenis may bounce a programmatic `scrollTo` back under headless — don't over-invest in scrolled screenshots; rely on the build + targeted shots (top of page, or `?still`).

## Pre-deploy checklist

- `npm run build` passes (exit 0).
- No errors in `preview_console_logs`.
- Reduced-motion path verified (animations off, 3D static).
- Responsive at 360 / 768 / 1440.
- `rm -rf .next` before packaging for deploy (lean upload, no stale cache).

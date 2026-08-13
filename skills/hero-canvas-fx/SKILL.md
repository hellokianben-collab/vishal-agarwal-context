---
name: hero-canvas-fx
description: >
  Reusable patterns for leveling up a plain HTML/CSS/JS marketing site (Express +
  Vercel, glass/dark theme, no framework): (1) animated canvas hero backgrounds —
  a 2D "trade-lanes" flow and a pseudo-3D rotating dot-globe with shipping arcs,
  both DPR-aware, reduced-motion-safe, paused off-screen; (2) splitting a
  single-scroll page into standalone destination pages that reuse the shared theme
  with self-contained per-page JS; (3) verifying/iterating canvas visuals in a
  headless in-app browser where requestAnimationFrame is throttled. Use when adding
  a moving hero background, a globe/network/particle backdrop, a "make the hero more
  eye-catching" ask, splitting a section (book/board/etc.) onto its own page, or when
  a canvas draws blank in the preview pane. Extracted from the KiAnben site
  (companion to the `kianben-web` skill); applies to any file-based Node/HTML site.
---

# Hero canvas FX + page split (plain HTML/CSS/JS sites)

Distilled from building KiAnben's hero + standalone pages. Site shape: single
`index.html` + `styles.css` + `main.js`, dark glass theme, Express `server.js`
static whitelist, deployed on Vercel. See `kianben-web` for that project's map/deploy.

> **Bold-path note:** when the user grants full permission to choose the effect,
> prefer a **real WebGL 3D** hero (three.js via CDN — the site runs
> `helmet({contentSecurityPolicy:false})`, so external scripts load in prod) over a
> faked 2D/pseudo-3D canvas. The canvas recipes below are the *fallback*, not the
> ceiling. (See memory `work-boldly-when-authorized`.)

---

## Pattern A — animated canvas hero background

### Layering & CSS
Put a canvas as the **first child of the hero**, behind the content:

```html
<section class="hero on-ink" id="home">
  <canvas id="heroGlobe" class="hero-fx" aria-hidden="true"></canvas>
  <div class="wrap hero-in"> …copy + card… </div>
</section>
```
```css
.hero { position: relative; overflow: clip; }         /* clips the canvas */
.hero-fx { position:absolute; inset:0; width:100%; height:100%;
           pointer-events:none; z-index:0; }
.hero-in { position: relative; z-index: 1; }          /* content ABOVE canvas */
```
Canvas is transparent → global ambient layers (aurora/particles) show through.
Content at `z-index:1` keeps text contrast intact.

### Lifecycle skeleton (every hero canvas)
- Size to the **host element** rect × DPR (cap DPR at 2), `ctx.setTransform(DPR,…)`,
  redraw model on resize.
- `if (REDUCED) { frame(0); return; }` — draw **one static frame**, no loop.
- rAF `loop`; `start()`/`stop()` guarded by a `running` flag.
- Pause on `visibilitychange` (hidden) **and** when the hero leaves the viewport
  (`IntersectionObserver`).
- Optional gentle **mouse parallax**: eased `pointermove` offset.

```js
function initHeroFx() {
  const cv = document.getElementById('heroGlobe'); if (!cv) return;
  const host = cv.parentElement, ctx = cv.getContext('2d', { alpha:true });
  const DPR = Math.min(devicePixelRatio||1, 2);
  let W,H,raf=0,running=false;
  function size(){ const r=host.getBoundingClientRect(); W=r.width;H=r.height;
    cv.width=W*DPR;cv.height=H*DPR;cv.style.width=W+'px';cv.style.height=H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0); build(); }
  function frame(step){ ctx.clearRect(0,0,W,H); /* draw model using `step` (ms) */ }
  const loop=ts=>{ frame(ts||1); raf=requestAnimationFrame(loop); };
  const start=()=>{ if(running)return; running=true; raf=requestAnimationFrame(loop); };
  const stop =()=>{ running=false; cancelAnimationFrame(raf); };
  size(); if (REDUCED){ frame(0); return; } start();
  addEventListener('resize', size, {passive:true});
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting?start():stop()),{threshold:0}).observe(host);
}
```

### Recipe 1 — 2D "trade lanes" (glowing packets on curved routes)
Origin nodes → a hub; quadratic-bezier routes; packets travel `t:0→1` (depth =
size grows toward hub); short fading trail + halo + core per packet. Subtle
(alpha .08–.1 routes) → good as a *calm* backdrop. Verdict from the session: too
subtle for a "wow" ask.

### Recipe 2 — pseudo-3D rotating dot-globe (the eye-catching one)
Sphere projected in JS (no WebGL). The gem worth keeping:

```js
// Fibonacci sphere → even dots
const g=Math.PI*(3-Math.sqrt(5));
for(let i=0;i<N;i++){const y=1-(i/(N-1))*2,r=Math.sqrt(Math.max(0,1-y*y)),th=g*i;
  DOTS.push({x:Math.cos(th)*r,y,z:Math.sin(th)*r,gold:i%13===0});}
// lat/lon → unit vec (place real cities: BD hub + origin countries)
const ll=(lat,lon)=>{const a=lat*Math.PI/180,o=lon*Math.PI/180;
  return{x:Math.cos(a)*Math.sin(o),y:Math.sin(a),z:Math.cos(a)*Math.cos(o)};};
// spin(Y)+tilt(X) then orthographic project; dz>0 = front hemisphere
function project(v){const x1=v.x*cosA+v.z*sinA,z1=-v.x*sinA+v.z*cosA;
  const y2=v.y*cosT-z1*sinT,z2=v.y*sinT+z1*cosT;
  return{sx:CX+x1*R,sy:CY-y2*R,dz:z2};}
// arcs = slerp(a,b,t) lifted outward: {x*L,y*L,z*L}, L=1+0.6*sin(pi*t); comet at moving p
// rings = great circle ⟂ axis n: basis u⟂n, v=n×u, sample cos/sin, draw front (dz>-.05)
```
Draw order per frame: atmosphere radial-gradient → dots (front bright `.24+b*.78`,
back faint) → 3 great-circle **rings** (equator + 2 meridians) → bright **rim**
circle → **arcs** + traveling **comets** (white core + trail + halo) → pulsing
**hub** marker. `ang += 0.0016` per frame for a slow spin.

**Composition gotchas (cost several iterations):**
- Keep the **whole sphere on-screen**: desktop `CX≈0.70W, CY≈0.42H,
  R=min(0.28W,0.46H,300)`. Too-far-right → arcs shoot off-canvas.
- A card floating in front covers the sphere's center → the hub/arc convergence
  hides behind it. Raise arc **lift (~0.6–0.7)** so arcs soar over the card, and
  spread origins so comets keep sweeping the visible crescent as it rotates.
- Arcs read as "wow" **in motion**; a frozen frame only shows front-facing ones.

---

## Pattern B — split a single-scroll page into standalone pages

When a section is a real *destination* (commerce flow, dynamic feed) rather than
marketing copy, give it its own page. **Do** split: shop/book, community board.
**Don't** split: services (the core pitch) or sign-in (a modal is the right auth
pattern). Keep a **teaser** of dynamic content on the homepage linking to the page.

Steps (mirror for each new page, e.g. `book.html`/`board.html`):
1. New `page.html`: copy the `<head>` (fonts, styles.css, canonical/OG for the new
   URL), the **icon sprite subset**, a slim nav whose links point back to
   `index.html#section` (mark the current page `active`), the moved section markup,
   a mini footer, moved modal(s), `<div class="toast">`, and `<script src="page.js">`.
2. New `page.js`: **self-contained** — do NOT load the monolith `main.js` (it
   `getElementById`s dozens of missing nodes). Copy only what the page needs
   (nav toggle, reveal observer, modals, the feature logic) reusing the **same
   `/api/...` contract**. Add a lightweight `[data-tilt]` handler if used.
3. `index.html`: point the top-nav + footer links to `page.html`; remove the moved
   section (leave a comment) and its now-orphan modal; replace a dynamic feed with
   a **teaser** (`<div id="feed" data-limit="3">` + a "See the full …" link).
   `main.js` guards (`?.`, `if(!el)return`) mean removed nodes noop safely.
4. `main.js`: honor `data-limit` on the teaser feed
   (`feed.dataset.limit` → `slice(0,limit)`).
5. **server.js**: add `page.html`/`page.js` to the `FRONT_END` static whitelist
   **and** a clean route (`app.get('/book', (req,res)=>sendStatic(res,'book.html'))`)
   before the `*` catch-all.
6. **vercel.json** `includeFiles`: add `page.html` + `page.js` (else 404 on Vercel).
7. **sitemap.xml**: add the clean URL.

---

## Pattern C — verify canvas visuals in a headless preview

The in-app Browser pane (and heavy CSS/canvas pages) fight you:

- **Screenshot tool times out** on the heavy hero (canvas + particles). Don't rely
  on it — verify via DOM/JS reads and rendered stills instead.
- **rAF is throttled** when the preview pane isn't focused → a live canvas reads as
  **blank** (`getImageData` all-zero) even though the code is correct. Prove the
  draw by calling `frame()` **directly**:
  ```js
  let src = await fetch('/main.js?v='+Date.now()).then(r=>r.text());
  src = src.replace('const loop = ts =>','window.__f=frame; const loop = ts =>');
  new Function(`const IntersectionObserver=function(cb){return{observe(){},disconnect(){}}};`
    + src + ';try{initHeroFx()}catch(e){window.__e=e.message}')();
  window.__f(1200);                       // draw one frame at a chosen timestamp
  // then getImageData → count non-zero px; call __f(t1)/__f(t2) → sums differ = animates
  ```
- **Browser caches `styles.css`/`main.js`** (`max-age=3600`). After edits, the tab
  keeps stale assets. Bust in-page: re-insert the `<link>`/refetch with `?v=Date.now()`.
  A plain `navigate` reloads the no-cache **HTML** but not the cached JS/CSS — the
  user must hard-refresh (Ctrl+Shift+R); new deploys serve fresh files to new visitors.
- **Export a still to show the user** (screenshot hangs): draw a frame to an
  offscreen canvas over the dark bg (+ optional mock card rect), `toDataURL('image/png')`.
  The huge dataURL exceeds the tool-result token cap and is **saved to a file**;
  decode it with python (`json → [{text}] → regex data:image/png;base64,… →
  base64.b64decode → write .png`) then `Read` the PNG to view / `SendUserFile` to share.
  (JPEG `q≈0.7` sometimes fits inline for dark images.)

---

## Pattern D — deploy & verify (Vercel)
`vercel deploy --prod --yes --no-wait --scope <scope>` → poll
`vercel inspect <url> --scope <scope> | grep -i status` until `● Ready`. Then
curl-verify prod: routes `200`, new markup present
(`curl -s https://site/ | grep -o 'id="heroGlobe"'`), JS shipped
(`curl -s https://site/main.js | grep -o 'function initHeroFx'`). Prefer curl/JS
assertions over screenshots. See `kianben-web` for that project's exact scope/URLs.

---

## Session record (2026-07-14/15) — where these patterns came from

Chronology of the KiAnben session this skill was extracted from, so a fresh
conversation can pick up exactly where it left off:

1. **Book → standalone page** (`/book`): moved the REF-07 book section + order
   modal out of `index.html` into `book.html` + self-contained `book.js`; added a
   free **preview reader** (4 pages in `DEFAULT_PREVIEW`, overridable via
   `book_config.preview`; prev/next + dots + keyboard; locked "order your copy"
   final page). Wired server whitelist + `/book` route, vercel `includeFiles`,
   sitemap. → Pattern B.
2. **Board → standalone page** (`/board`): same recipe (`board.html`/`board.js`,
   full feed + submit-notice modal). Homepage kept a **3-item teaser**
   (`#announcementFeed[data-limit="3"]` — `main.js` slices to `data-limit`) + "See
   the full board" button. **Deliberately NOT split:** Services (core pitch stays
   inline) and Sign-in (modal is correct auth UX) — user accepted this reasoning.
3. **Hero seal → live-pool chip**: user circled the spinning "LICENSED IMPORT
   COMMUNITY" seal in a screenshot → removed `.seal` (and its dead parallax ref in
   `initParallax`), replaced with `.wb-badge` "● Live pool · 11 members joined"
   glass chip, `top:-30px` so it clears the KB-2026-031 number by 8px,
   `role="status"`, pulse dot off under reduced-motion.
4. **Hero motion v1 — 2D trade lanes** (`initTradeLanes`): user said "add
   something moving, 3D or 2D, you choose, full permission". Shipped the subtle
   packets-on-bezier-routes canvas. → Recipe 1.
5. **Hero motion v2 — dot-globe** (`initHeroGlobe`): user: "not satisfied, more
   eye-catching". Replaced with the pseudo-3D rotating globe (Fibonacci dots,
   rings, rim, atmosphere, 11 origin→BD arcs with comets, mouse tilt). Iterated
   composition: brightened dots, added rings, pulled globe on-screen
   (`CX .70W / CY .42H / R min(.28W,.46H,300)`), arc lift 0.64. → Recipe 2.
   Deployed to prod; verified `id="heroGlobe"` + `initHeroGlobe` live on
   kianben.com.
6. **User feedback (important, saved to memory):** disappointed despite deploy —
   (a) I anchored to their examples instead of thinking bigger; (b) given full
   permission I picked easy 2D over hard real-3D ("behaved like a lazy person");
   (c) I never used `/find-skills` or asked them to add a capability. Memories:
   `work-boldly-when-authorized`, `use-find-skills-for-capability-gaps`.
7. **Open offer / next step:** build the **real three.js WebGL hero** — lit Earth
   sphere (day-night terminator, fresnel atmosphere), 3D tube shipping arcs with
   emissive comets, bloom post-processing, drag-to-rotate with inertia. No
   blocker: helmet CSP is disabled so the CDN loads in prod. User had not yet
   said "go" when the session ended — if they ask to continue the hero work,
   **this replacement is the expected deliverable**, replacing `initHeroGlobe`.

Prod state at session end: kianben.com live with `/book`, `/board`, wb-badge chip,
canvas dot-globe hero. Local dev via `.claude/launch.json` server `kianben-dev`
(port 3000). Placeholders still pending (real book title/price/preview text via
admin; www subdomain; Neon password rotation — see `kianben-web` TODOs).

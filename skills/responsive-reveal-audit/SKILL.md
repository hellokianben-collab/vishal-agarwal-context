---
name: responsive-reveal-audit
description: >-
  Find and fix layout, responsive and scroll-animation bugs on an existing
  website by MEASURING it in a browser instead of eyeballing it. Use this
  whenever someone says a site "isn't visible properly on mobile", "looks broken
  on my phone", "text/buttons are cut off", "the menu doesn't open on mobile",
  "buttons break in the middle", "fonts should scale with the screen", "the
  animations load late", "content is blank until I scroll back up", "it lags
  when I scroll fast", or asks to make an existing page responsive, audit it
  across device sizes, or fix its scroll transitions. Also use it before
  redesigning a live page, since it tells you which problems are real and which
  are imagined. Applies to any plain HTML/CSS/JS or framework-rendered site, not
  a particular project. Reach for this even when the user only describes a vague
  visual complaint — the probes turn "looks off" into exact pixel numbers, which
  is usually the whole difficulty.
---

# Responsive & scroll-reveal audit

The premise: **most "it looks broken on mobile" reports are one or two specific,
measurable defects, not a general vibe.** Eyeballing a page — or worse,
screenshotting it — finds the ugly parts, not the broken parts. Measuring finds
the broken parts, and the numbers are what let you fix the cause instead of
padding around the symptom.

Work in this order. Each stage feeds the next.

## 1. Measure before you touch anything

Open the page in a browser tool, set the viewport to a real phone width, and run
`scripts/overflow-probe.js` via whatever JS-evaluation tool the browser
integration gives you. It returns every element sticking outside the viewport,
with how many pixels each overshoots.

Run it at **320, 360, 390, 768 and 1440** at minimum. 320 is the floor that still
has real users; 360–414 is where the bulk of phone traffic actually sits; 768
catches tablet/breakpoint seams; 1440 is your regression check that you didn't
wreck desktop while fixing mobile.

Record the numbers before you edit. You need the "before" to prove the "after",
and a surprising share of reported problems turn out to be somewhere else
entirely.

### The trap that hides everything

`body { overflow-x: hidden }` is on almost every site. It does **not** prevent
overflow — it *clips* it and removes the user's ability to scroll to it. A
column, a CTA or a whole nav control ends up outside the screen with no
scrollbar, no glitch, and no way to reach it.

`scrollWidth` is not a reliable detector of this, in two different ways:

- **In-flow content still grows `scrollWidth`** even while `overflow-x: hidden`
  makes it unscrollable. So a large `scrollWidth` tells you something overflows
  but not that the user can get to it.
- **Overflow from a `position: fixed` element never extends the scroll area at
  all.** A fixed navbar whose hamburger sits 100px past the right edge reports a
  perfectly normal `scrollWidth`. This is the nastiest version, because a fixed
  header is exactly where an unreachable control does the most damage.

So check `overflowCount` per element. Treat `docScrollW` as informational only —
the probe returns it for context, not as a verdict.

Note the probe skips fixed elements *and their descendants* from the main count.
Without the descendant part, any open modal or drawer floods the results with
false positives, since its children are laid out relative to the fixed overlay
rather than the document.

Because that skip would also hide the fixed-header case, the probe scans fixed
containers separately and returns **`unreachableControls`** — links, buttons and
inputs that sit outside their own fixed parent's box. Read that field first: a
single entry there outranks any number of cosmetic overflows, because it means
something on the page cannot be tapped at all. `fixedEscapeeCount` includes
decorative layers too, so it is context rather than a verdict; push
project-specific decoration into `EXTRA_IGNORE` at the top of the script.

Exclude decorative layers from the probe results (blurred background blobs,
marquee/ticker tracks inside `overflow:hidden`, fixed canvases, elements inside
`svg`). They overflow by design. The bundled probe already filters common cases
and takes an extra selector list.

## 2. Interrogate the scroll animations

If the site fades content in on scroll, test the thing users actually do:
**drag the scrollbar straight to the footer**, or press End. Then scroll back up.

`scripts/reveal-probe.js` does this and reports how many animated elements are
still at `opacity: 0` afterwards.

A plain `IntersectionObserver` reveal only fires when an element **crosses** the
viewport edge. Jump past twenty sections in one frame and nothing crosses
anything — the observer stays silent and those sections stay invisible **for the
rest of the session**. The user scrolls back up to a blank page. This reads as
"the animations load late"; it is actually "the content never loads at all", and
it is one of the most common serious bugs on animated marketing sites.

The second failure is stagger that scales with batch size. `index * 80ms` across
a batch of twenty is 1.6 seconds of dribble, all of it spent after the reader has
already moved on.

### The fix that holds

Three ingredients, and it's the combination that matters:

1. **A rect sweep as the safety net.** Independently of the observer, reveal
   anything whose `getBoundingClientRect().top` is already above the fold. This
   is what makes a scrollbar drag impossible to break, because it asks "where is
   this now?" rather than "did I see it move?".
2. **Capped stagger.** `Math.min(index, 4) * 55ms` keeps the cascade feel without
   letting a big batch queue up seconds of delay.
3. **Velocity awareness.** Track scroll speed; above roughly 55px/frame the
   reader is skimming, so drop the stagger to zero and collapse the transition
   (a CSS class on `<html>` driving a `--duration` custom property works well).
   Motion should get out of the way of someone who is clearly in a hurry.

Also make the sweep fall back from `requestAnimationFrame` to a timer while
`document.hidden`, or a tab restored from the background sits on invisible
content until the user happens to scroll.

`scripts/reveal-engine.js` is a drop-in implementation of all of this.

## 3. Fix layout at the cause

Once you know *what* overflows, fix the reason rather than clamping the symptom.
The usual causes, in rough order of frequency:

- **A horizontal bar with too many children** (logo + links + CTA + burger).
  Below the breakpoint, move the CTA into the mobile drop-down instead of
  shrinking everything until the burger falls off the edge. Bind the moved copy
  to a **class** hook, never an `id`, so the original and the copy can coexist.
- **Fixed `rem` sizing everywhere.** A site with 100+ hard-coded `font-size`
  declarations cannot be made responsive breakpoint by breakpoint. Define a fluid
  ramp once in `:root` and use it (see below).
- **Tables.** Three columns of prose will not fit 320px. Wrap in an
  `overflow-x: auto` container with a sensible `min-width`, and let the value
  column wrap at narrow widths so scrolling is the fallback, not the default.
  Note that a table inside a card with `overflow: hidden` is *clipped*, not
  scrollable — the wrapper is what makes it reachable.
- **Missing `min-width: 0`.** Grid and flex children default to `min-width: auto`
  and refuse to shrink below their content. This single declaration on layout
  children fixes a large fraction of mystery overflows.
- **`100vh`.** On mobile browsers `vh` includes the retracting URL bar, so the
  fold lands below the screen on first paint. Use `svh` (and `svh`/`dvh` for
  modal `max-height`).

### The fluid type ramp

Rather than re-tuning sizes at every breakpoint, define steps that interpolate
between a floor that's readable on a small phone and a ceiling that stops growing
on desktop:

```css
:root {
  --t-sm:  clamp(.80rem, .75rem + .24vw, .90rem);
  --t-md:  clamp(.88rem, .83rem + .26vw, .96rem);
  --t-lg:  clamp(.98rem, .92rem + .32vw, 1.10rem);
  --t-2xl: clamp(1.22rem, 1.05rem + .8vw, 1.45rem);
  --pad-sec:  clamp(72px, 9vw, 120px);
  --pad-card: clamp(20px, 4.4vw, 30px);
}
```

The `Xrem + Yvw` middle term (rather than bare `vw`) is deliberate: it keeps the
text zoomable, which pure viewport units break for low-vision users.

Apply the same idea to rhythm — section and card padding scale too, which is
often what makes a long mobile page feel endless.

### Buttons that must not break mid-word

"Don't let the label break in the middle" is a common and reasonable request. The
answer is to allow wrapping **between words only**, and to shrink the type before
it comes to that:

```css
.btn {
  white-space: normal;        /* nowrap would overflow instead of wrapping */
  overflow-wrap: normal;      /* never split inside a word */
  word-break: keep-all;
  hyphens: none;
  text-wrap: balance;
  max-width: 100%;
  font-size: clamp(.84rem, .78rem + .28vw, .95rem);
  padding: 13px clamp(15px, 1rem + 1.6vw, 26px);
}
```

`white-space: nowrap` is the instinctive choice and it is wrong: a nowrap label
wider than its container overflows the screen rather than wrapping. Verify with
the probe's `btnClipped` count, which flags any button whose `scrollWidth`
exceeds its `clientWidth`.

## 4. Check the specificity of your animation rules

A single-class selector like `.reveal` loses to any component rule shaped like
`.card li` or `.nav a` (0-1-1 beats 0-1-0). The symptom is maddening and easy to
misread: most elements animate and a few snap in with no fade, with nothing
obviously different about them.

Doubling the class — `.reveal.reveal` — lifts it to 0-2-0 and wins, without
`!important`. Remember to bump every related rule the same way, including the
`prefers-reduced-motion` override, or reduced-motion users lose their exemption.

Be aware that setting the `transition` shorthand on a revealed element
**replaces** that element's own transition rather than merging, so component
hover easing disappears. If that matters, use `transition-property` /
`transition-duration` and include the component's properties.

## 5. Performance, if scrolling feels heavy

Three things account for most jank on mid-range Android:

- **A `position: fixed` full-screen canvas** keeps rendering forever, including
  when the user is 13,000px down the page and it is pure ambience. Disable it
  below ~760px, and honour `navigator.connection?.saveData`.
- **Parallax on large blurred elements.** Translating a 60vmax blob with a 110px
  blur forces the compositor to re-blur that whole surface every frame. Desktop
  only.
- **Layout reads in a scroll handler.** `offsetTop` / `getBoundingClientRect` on
  every section on every scroll event forces a synchronous layout each time.
  Cache the offsets, re-measure on resize and load, and throttle with `rAF`.

## 6. Ship it without a stale-CSS mismatch

Check the cache headers before deploying. The common pattern — HTML `no-cache`,
CSS/JS `max-age=3600` — means a returning visitor gets **new markup with old
styles** for up to an hour. If your fix added markup (a moved CTA, a new
wrapper), that visitor sees a genuinely broken hybrid: duplicated buttons,
unstyled containers.

Append a version query to every asset link (`styles.css?v=7`) and bump it on
every CSS/JS deploy. It costs nothing and removes an entire class of
"it works for me" reports. Remember pages you didn't edit but which share the
stylesheet — an admin panel is easy to forget.

## Verifying in a preview pane that can't paint

Headless and hidden browser panes stop compositing. `requestAnimationFrame` never
fires, `IntersectionObserver` callbacks are never delivered, and screenshots time
out. Reveal logic looks completely broken when it is fine — do not start
debugging the site from those readings.

`getBoundingClientRect` still works, which is exactly why the layout probes are
the reliable half of this method. To exercise rAF/observer-driven behaviour, shim
it and drive the events by hand — `scripts/reveal-probe.js` does this already:

```js
const realRaf = window.requestAnimationFrame;
window.requestAnimationFrame = fn => setTimeout(() => fn(performance.now()), 16);
document.documentElement.style.scrollBehavior = 'auto';  // else scrollTo animates
scrollTo(0, document.documentElement.scrollHeight);
dispatchEvent(new Event('scroll'));
// ...assert...
window.requestAnimationFrame = realRaf;
```

Note the `scrollBehavior` line: a global `html { scroll-behavior: smooth }` makes
programmatic `scrollTo` animate, so an instant jump you *thought* you performed
actually took a second — which quietly invalidates the measurement.

## Report the numbers

Give before/after per width, because that is what makes the work checkable:

```
              320px          390px          1440px
before   nav +178px over   burger off-screen   ok
after    0 overflow        0 overflow          unchanged
reveal   0/23 revealed  →  23/23 in ~120ms
```

Then re-run the probes against **production** after deploying, not just against
localhost. Build output, CDN rewrites and cache layers all sit between the two,
and this is the step that catches the version-marker mistakes from §6.

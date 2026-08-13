/* ────────────────────────────────────────────────────────────────
   REVEAL PROBE — does a scrollbar drag to the footer strand content?

   Paste into a browser JS-eval tool. Simulates the thing users actually
   do (drag the scrollbar to the bottom / press End) and reports how many
   scroll-animated elements are still at opacity 0 afterwards.

   A plain IntersectionObserver reveal only fires when an element CROSSES
   the viewport edge. Jump past twenty sections in one frame and nothing
   crosses anything, so those sections stay invisible for the rest of the
   session. `strandedAfterDrag > 0` is that bug.

   Two shims are needed and both matter:
   · rAF → timer, because a hidden/headless pane never fires rAF, so
     reveal logic looks broken when it is fine.
   · scroll-behavior → auto, because a global `smooth` makes scrollTo
     ANIMATE — the instant jump you think you performed took a second,
     which quietly invalidates the measurement.
   ──────────────────────────────────────────────────────────────── */
(async () => {
  // Adjust if the project marks animated elements differently.
  const SEL        = '.reveal, [data-reveal], .animate-on-scroll, .fade-in';
  const SHOWN_SEL  = '.visible, .is-visible, .revealed, .in-view';

  const realRaf = window.requestAnimationFrame;
  const realSB  = document.documentElement.style.scrollBehavior;
  window.requestAnimationFrame = fn => setTimeout(() => fn(performance.now()), 16);
  document.documentElement.style.scrollBehavior = 'auto';

  const all     = () => document.querySelectorAll(SEL);
  const hidden  = () => [...all()].filter(el => !el.matches(SHOWN_SEL) &&
                                                getComputedStyle(el).opacity === '0');
  const wait    = ms => new Promise(r => setTimeout(r, ms));

  const total = all().length;
  if (!total) {
    window.requestAnimationFrame = realRaf;
    return { note: 'no scroll-animated elements matched ' + SEL };
  }

  scrollTo(0, 0);
  await wait(350);
  const atTop = total - hidden().length;

  // the actual test: one instant jump to the footer
  scrollTo(0, document.documentElement.scrollHeight - innerHeight);
  dispatchEvent(new Event('scroll'));

  const timeline = [];
  for (const ms of [120, 300, 600, 1200]) {
    await wait(ms === 120 ? 120 : 200);
    timeline.push({ at: ms + 'ms', revealed: total - hidden().length + '/' + total });
  }

  const stranded = hidden().map(el => ({
    cls: (el.className || el.tagName).toString().split(/\s+/)[0],
    top: Math.round(el.getBoundingClientRect().top),
    alreadyPassed: el.getBoundingClientRect().bottom < 0
  }));

  window.requestAnimationFrame = realRaf;
  document.documentElement.style.scrollBehavior = realSB;

  return {
    url: location.href,
    total,
    revealedAtTop: atTop,
    timeline,
    strandedAfterDrag: stranded.length,   // 0 is the goal
    stranded: stranded.slice(0, 20),
    // A global smooth scroll-behavior also slows real anchor navigation.
    globalSmoothScroll: getComputedStyle(document.documentElement).scrollBehavior === 'smooth'
  };
})()

/* ────────────────────────────────────────────────────────────────
   REVEAL ENGINE — drop-in replacement for a bare IntersectionObserver
   scroll-reveal. Framework-free; copy into the site's JS.

   Pass it a list of elements that already carry the hidden-state class:
     revealEngine([...document.querySelectorAll('.reveal')]);

   Companion CSS (note the DOUBLED class — a single `.reveal` is 0-1-0 and
   loses to component rules shaped like `.card li`, which strips the fade
   off scattered elements for no visible reason):

     :root { --rv-dur: .7s; }
     .reveal.reveal {
       opacity: 0; transform: translateY(24px); filter: blur(5px);
       transition: opacity   var(--rv-dur) cubic-bezier(.22,.61,.36,1),
                   transform var(--rv-dur) cubic-bezier(.22,.61,.36,1),
                   filter    var(--rv-dur) cubic-bezier(.22,.61,.36,1);
     }
     .reveal.visible { opacity: 1; transform: none; filter: none; }
     html.is-fast-scroll .reveal.reveal { --rv-dur: .24s; filter: none; }
     html.is-fast-scroll .reveal.visible { transform: none; }
     @media (max-width: 760px) {            // software blur costs real frames
       .reveal.reveal { filter: none; transform: translateY(18px); --rv-dur: .5s; }
       .reveal.visible { transform: none; }
     }
     @media (prefers-reduced-motion: reduce) {
       .reveal.reveal { opacity: 1; transform: none; filter: none; }
     }
   ──────────────────────────────────────────────────────────────── */
function revealEngine(list) {
  if (!list.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    list.forEach(el => el.classList.add('visible'));
    return;
  }

  const pending = new Set(list);
  const root = document.documentElement;

  const show = (el, delay) => {
    if (!pending.has(el)) return;
    pending.delete(el);
    if (delay > 0) setTimeout(() => el.classList.add('visible'), delay);
    else el.classList.add('visible');
    if (!pending.size) { io.disconnect(); removeEventListener('scroll', onScroll); }
  };

  /* The safety net, and the reason this engine exists. An observer only
     reports CROSSINGS; a scrollbar drag past twenty sections produces no
     crossing at all, so without this sweep those sections stay at opacity 0
     permanently and the page reads blank on the way back up. Asking "where
     is this now?" cannot miss the way "did I see it move?" can. */
  let queued = 0;
  const runSweep = () => {
    queued = 0;
    const fold = innerHeight * 0.94;
    for (const el of [...pending]) {
      if (el.getBoundingClientRect().top < fold) show(el, 0);
    }
  };
  const sweep = () => {
    if (queued || !pending.size) return;
    // A background tab never fires rAF, so a restored tab would sit on
    // invisible content until the reader happened to scroll.
    queued = document.hidden ? setTimeout(runSweep, 0) : requestAnimationFrame(runSweep);
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sweep(); });

  /* Above ~55px per frame the reader is skimming, not reading. Motion should
     get out of the way rather than make them wait for it. */
  let lastY = scrollY, lastT = performance.now(), fast = false, fastT = 0;
  const onScroll = () => {
    const now = performance.now();
    const v = Math.abs(scrollY - lastY) / Math.max(now - lastT, 1) * 16.7;
    lastY = scrollY; lastT = now;
    if (v > 55) {
      if (!fast) { fast = true; root.classList.add('is-fast-scroll'); }
      clearTimeout(fastT);
      fastT = setTimeout(() => { fast = false; root.classList.remove('is-fast-scroll'); }, 200);
    }
    sweep();
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', sweep, { passive: true });

  const io = new IntersectionObserver(entries => {
    let step = 0;
    for (const e of entries) {
      // below the fold and not touching it yet → leave it alone.
      // above the fold (top <= 0) → already passed, show it immediately.
      if (!e.isIntersecting && e.boundingClientRect.top > 0) continue;
      // Stagger is CAPPED. `index * 80ms` across a batch of twenty is 1.6s of
      // dribble spent after the reader has already gone by.
      show(e.target, fast ? 0 : Math.min(step++, 4) * 55);
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });

  list.forEach(el => io.observe(el));
  sweep();   // first paint — anything already on screen
}

/* ────────────────────────────────────────────────────────────────
   OVERFLOW PROBE — paste into a browser JS-eval tool, per viewport width.

   Returns every element sticking outside the viewport and by how much.
   This is the reliable half of the audit: getBoundingClientRect keeps
   working even in a preview pane that has stopped compositing (where
   screenshots time out and rAF never fires).

   Read `overflowCount`, NOT `docScrollW`. `body { overflow-x: hidden }`
   is on nearly every site and silently CLIPS overflow, so scrollWidth
   equals the viewport while a nav button sits off-screen unreachable.

   Optional: set EXTRA_IGNORE below to skip project-specific decorative
   layers before running.
   ──────────────────────────────────────────────────────────────── */
(() => {
  // Decorative layers that overflow on purpose. Add project-specific
  // selectors here — blurred blobs, marquee tracks, parallax canvases.
  const EXTRA_IGNORE = [];

  const IGNORE = [
    '.aurora', '.lanes', '.marquee', '.ticker',      // clipped scrolling strips
    '.cargo-float', '.orbit', '.blob',               // floating decoration
    '[data-decorative]',
    ...EXTRA_IGNORE
  ];

  const vw = document.documentElement.clientWidth;
  const seen = new Set();
  const offenders = [];

  /* Skip fixed elements AND everything inside them. Their children are laid
     out against the fixed box, not the document, so an open modal or drawer
     otherwise floods the results with a dozen phantom offenders and buries
     the real one. */
  const inFixedSubtree = el => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (getComputedStyle(n).position === 'fixed') return true;
    }
    return false;
  };

  document.querySelectorAll('body *').forEach(el => {
    if (IGNORE.some(sel => { try { return el.closest(sel); } catch { return false; } })) return;
    if (el.closest('svg')) return;                   // svg internals use their own coord space

    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;               // hidden / collapsed
    if (inFixedSubtree(el)) return;                  // viewport-anchored by design

    if (r.right > vw + 1 || r.left < -1) {
      // one row per distinct tag+class, not per instance — 40 identical
      // cards overflowing is one bug, not forty
      const key = el.tagName + '|' + (el.className || '');
      if (seen.has(key)) return;
      seen.add(key);

      const cls = typeof el.className === 'string' && el.className
        ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
        : '';
      const parent = el.parentElement;
      offenders.push({
        sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + cls,
        parent: parent ? parent.tagName.toLowerCase() +
          (typeof parent.className === 'string' && parent.className
            ? '.' + parent.className.trim().split(/\s+/)[0] : '') : '',
        overRight: Math.round(r.right - vw),
        left: Math.round(r.left),
        text: (el.textContent || '').trim().slice(0, 30)
      });
    }
  });

  // Buttons whose label does not fit their own box.
  const btnClipped = [...document.querySelectorAll('button, .btn, a.btn, [role=button]')]
    .filter(b => b.scrollWidth > b.clientWidth + 1)
    .map(b => ({ label: b.textContent.trim().slice(0, 28), scrollW: b.scrollWidth, clientW: b.clientWidth }));

  /* Fixed subtrees are skipped above, but they are also where the WORST
     version of this bug lives: a fixed header whose controls spill past its
     own right edge reports a completely normal scrollWidth, shows no
     scrollbar, and simply cannot be tapped. So check each fixed container's
     children against the container's own box. This is the generalised form
     of "the hamburger is off-screen". */
  const fixedEscapees = [];
  document.querySelectorAll('body *').forEach(el => {
    if (getComputedStyle(el).position !== 'fixed') return;
    if (IGNORE.some(sel => { try { return el.closest(sel); } catch { return false; } })) return;
    const box = el.getBoundingClientRect();
    if (!box.width) return;
    el.querySelectorAll('*').forEach(child => {
      const c = child.getBoundingClientRect();
      if (!c.width && !c.height) return;
      if (child.closest('svg')) return;
      if (c.right > box.right + 1 || c.left < box.left - 1) {
        const cls = typeof child.className === 'string' && child.className
          ? '.' + child.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
        fixedEscapees.push({
          container: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''),
          child: child.tagName.toLowerCase() + (child.id ? '#' + child.id : '') + cls,
          escapesRightBy: Math.round(c.right - box.right),
          interactive: !!child.closest('a, button, [role=button], input, select')
        });
      }
    });
  });
  // Interactive escapees are the urgent ones — a user cannot reach them.
  const unreachableControls = fixedEscapees.filter(e => e.interactive);

  // Convenience read on the most common instance of the above.
  let nav = null;
  const bar = document.querySelector('.nav-in, .navbar, header nav, header');
  const burger = document.querySelector('#hamburger, .burger, .hamburger, [aria-controls*="nav" i]');
  if (bar && burger) {
    const a = bar.getBoundingClientRect(), b = burger.getBoundingClientRect();
    nav = {
      burgerFits: b.right <= a.right + 1 && b.left >= a.left - 1,
      burgerRight: Math.round(b.right),
      barRight: Math.round(a.right)
    };
  }

  return {
    url: location.href,
    vw,
    overflowCount: offenders.length,
    offenders: offenders.slice(0, 15),
    btnClipped,
    // Controls a user physically cannot tap — treat any entry as a blocker.
    unreachableControls,
    fixedEscapeeCount: fixedEscapees.length,
    nav,
    // NOT a verdict: in-flow overflow inflates this even when unscrollable,
    // and fixed-element overflow never shows up in it at all.
    docScrollW: document.documentElement.scrollWidth
  };
})()

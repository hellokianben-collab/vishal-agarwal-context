# Landed — Bangladesh import landed-cost & NBR duty calculator

**Status:** live · **Built:** 30–31 Jul 2026 · **Stack:** plain HTML/CSS/JS, no build step, no
backend · **Live:** `iamvishalagarwal.com/landed` and `landed-sigma.vercel.app`

Rated **8.5/10** by the owner. Built in response to:

> *"I want you to make me a tool that can help me and create a fully working website for it. Build
> something meaningful. Not just something to pass by me. Then i would rate it and share it in the
> social media. **So your reputation depends on it.** Give it your best!!!"*

---

## The problem it solves

Bangladeshi importers budget off the headline customs duty and get destroyed, because NBR's tax
layers **compound**:

```
CD, RD  on  AV
SD      on (AV + CD + RD)
VAT, AT on (AV + CD + RD + SD)
AIT     on  AV
```

A "25% duty" line routinely becomes **80–130% total incidence**. The calculator shows the whole
cascade, line by line, so the number you plan against is the number you actually pay.

## What it carries

- The real **FY2026-27 Operative Tariff: 7,465 HS codes**, with code lookup, description search, and
  a confirm/revert override flow for when the automated match is wrong
- Auto-updating exchange rate
- Insurance and freight handling, invoice currency support
- Full cost breakdown with proportional bar charts

## Accuracy constraint that must never regress

The duty profiles are **indicative, not a customs assessment**. The page carries an explicit warning
callout. Nobody may present its output as an official NBR assessment — not the UI, not the marketing
copy, not an assistant summarizing it.

## The two CSP traps this project taught

Both generalize to any strict-CSP static site, and neither is visible from a local dev server
(which sends no CSP headers at all).

1. **`style-src 'self'` silently kills inline `style` attributes injected via `innerHTML`.** Every
   bar chart rendered full-width and nothing appeared in the console. CSP does **not** restrict
   CSSOM writes — so the fix is to emit markup without style attributes and set `el.style.width` in
   JS afterwards.
2. **`default-src 'none'` with no `connect-src` blocks `fetch()`** — including any console probe you
   try to run against the live page to diagnose the first problem. Diagnose deployed assets with
   `curl` from the shell instead.

## The mounted-copy rule

`iamvishalagarwal.com/landed` is a **generated** copy. Never hand-edit `vishal-site/landed/` — run
`node sync-landed.js` from `vishal-site`.

The reason is precise: at `/landed` with no trailing slash, a relative `assets/x` resolves to
`/assets/x`, so every CSS and JS file 404s **while the page still returns 200**. The sync script
rewrites relative asset paths to absolute.

## Caching

`Cache-Control` on assets is deliberately `max-age=0, must-revalidate`, and script/style tags carry
a `?v=N` query. **Bump `N` on any deploy that changes JS or CSS** or returning visitors run stale
code.

## Follow-on

`/community` grew out of this: member accounts (scrypt passwords) and **saved calculations**, so a
trader can keep a history of the containers they costed. The free `/invoice` generator was mounted
into the same community surface.

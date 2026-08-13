---
name: content-integrity-guard
description: >-
  Prevent invented facts, fabricated testimonials, edited quotes and regressed corrections from
  reaching anything published under a real person's name. Use whenever writing or editing copy for a
  real person's or business's site, adding testimonials/reviews/metrics/credentials, filling a
  placeholder, importing a design that contains lorem or sample content, or re-deploying a page whose
  facts were previously corrected. Also use as a pre-deploy gate — it carries a grep-based regression
  check. Short, absolute, and non-negotiable.
---

# Content integrity

Short skill, no nuance. Everything published under a real person's name must be true, and everything
they corrected once must never come back.

---

## The four absolutes

### 1. Never invent a testimonial, review, or a person

If only one of five reviews is publicly readable, **one review ships.** The other four slots stay
empty until the owner pastes them.

An invented testimonial is a fabricated statement attributed to a real named human. There is no
framing — "placeholder", "sample", "we'll replace it later" — that makes it acceptable on a live page.

### 2. Never edit a real person's quote

A genuine review contains the word "Bhai". The site has an English-only rule. **The quote stays
verbatim**, because rewriting a sourced quote falsifies it.

A style rule never outranks accuracy of attribution. Fix the style rule's scope, not the quote.

(A *designer's* placeholder quote is not a sourced quote — that one can be rewritten freely. Know
which you are holding.)

### 3. Never invent a number, a country, or a credential

Real corrections from this project, each of which had been wrong in a draft:

| Wrong | Right |
|---|---|
| 1,000+ / "thousands" mentored | **28+** |
| 6+ years in trade | **4+ years** |
| "Building Businesses Beyond Borders" | **_Prothom Container_** |
| "Bishal" | **Vishal** |
| "Confidence Cement" | **"Cement"** — no brand name anywhere |
| Bengali text on the site | **English only** |

An unresolved number goes to an open-questions file. It does not get averaged, rounded, or inferred
from context.

### 4. Never present an estimate as an authority

A duty calculator's output is **indicative, not a customs assessment**. A document checker is a
pre-check, **not a bank's examination**. The disclaimer is part of the feature, not decoration around
it — and it must survive every redesign.

---

## Where fabrication actually enters

1. **Design imports.** Exports from design tools arrive full of confident placeholder content — names,
   quotes, stats, even a misspelled version of the owner's name. Treat the export as a **layout
   spec**, never as copy. Every string is unverified until the owner confirms it.
2. **"Filling out" a page.** A section that looks thin invites invention. An empty state is the
   correct output for missing content.
3. **Re-deploys.** A corrected fact creeps back when an older file is restored or a section is
   rebuilt from memory.
4. **Summaries.** Restating a hedged claim without its hedge is the same error at one remove.

## The pre-deploy gate

Put the corrected facts in a grep list and run it before every deploy. This is cheap and it is the
only mechanism that actually catches regression.

```bash
# each of these must return NOTHING
for S in "Beyond Borders" "1,000+" "1000+" "6+ yrs" "6+ years" "Bishal" "Confidence Cement"; do
  grep -rn "$S" --include='*.html' --include='*.js' --include='*.css' . && echo "REGRESSION: $S"
done

# language rule: no Bengali codepoints anywhere in shipped copy
grep -rlP '[\x{0980}-\x{09FF}]' --include='*.html' --include='*.js' --include='*.css' . \
  && echo "REGRESSION: Bengali text present"
```

Note the Bengali check also catches the **Taka sign `৳` (U+09F3)**, which is inside the Bengali
block — an easy accidental violation when writing prices.

Keep this list in the project skill next to the corrections themselves, so the check and the fact
never drift apart.

## When you don't know

Three acceptable outputs, in order of preference:

1. **Ask.** One line, at the moment it blocks you.
2. **Ship an empty state.** A section that says nothing is honest.
3. **Ship the narrower true version.** "Trading across Bangladesh, China, India and Vietnam" instead
   of "5 countries" when only four are known.

**Not acceptable:** a plausible guess in a live page, and a note about it at the end of your message.
He will not read the note. The page will be live.

## Related

- `profile/05-open-questions.md` — the register of things that must be asked, not guessed
- `public-data-without-api-keys` — how to get real content so you don't have to invent it

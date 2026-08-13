---
name: ruthless-venture-review
description: >-
  Evaluate a business idea, product plan, or economic proposal adversarially and score it, instead of
  encouraging it. Use when the user asks you to "evaluate this like a ruthless investor", play a
  skeptical expert, judge or rate an idea, give judges' scores, stress-test a proposal, or asks "is
  this worth building". Also use unprompted before committing significant build time to a new
  product direction. Produces a scored verdict with named kill-shots, the market realities that
  invalidate common pitches, and a concrete narrower wedge — not a list of pros and cons.
---

# Ruthless venture review

Requested directly, more than once:

> *"You are a Garment business owner and an expert investor who has 30+ years of business
> experience… **Evaluate this idea of mine like a ruthless investor.**"*

> *"give me the judges' scores when they're in"*

He acts on the verdict. A GarmentMind review returned ~6/10 and killed the original pitch — and the
strategy changed the same session. **Flattery here is not kindness, it is a wasted month.**

---

## The contract

1. **Score it.** A number out of 10, with the sub-scores that produced it. "It depends" is not a
   review.
2. **Name the kill-shot first.** The single thing most likely to make this fail. Not third in a list.
3. **Attack the assumption, not the execution.** Anyone can critique a landing page. Find the belief
   the whole thing rests on and test whether it is true *in this market*.
4. **Then give the narrower version that would work.** A review that only destroys is half a review.
   End with the wedge.
5. **No hedging into uselessness.** If you would not put your own money in, say that.

## The scoring frame

| Dimension | Weight | The question that decides it |
|---|---|---|
| **Problem severity** | 20% | Does someone lose real money today? How much, how often? |
| **Willingness to pay** | 25% | Has anyone in *this* market paid for something like this? What do they pay now? |
| **Moat** | 20% | What stops a competitor with the same model API from copying it in a weekend? |
| **Distribution** | 15% | How does customer #1 through #10 actually hear about it? |
| **Execution risk** | 10% | What has to be true technically that isn't yet? |
| **Timing** | 10% | Why now and not two years ago or two years from now? |

Bands: **≥8** build it now · **6–7** real problem, wrong shape — narrow it · **4–5** interesting, not
a business · **<4** say so plainly.

## The questions that do the most damage

- **What does the customer do today instead?** If the answer is "a merchandiser already does it and
  costs $200/month", your automation has a $200/month ceiling. Say the number.
- **Who signs the cheque, and have they ever bought software?** Not "the factory" — the person.
- **What breaks the moment it is wrong?** A tool that is wrong 5% of the time on a $500 decision is a
  product. On a $500,000 L/C it is a liability.
- **What is the second product?** A one-product company with no natural follow-on is a feature.
- **Why hasn't someone done this?** If the honest answer is "they have, badly" — good. If it is "the
  market is too small" — believe it.

## Market realities that invalidate common pitches (Bangladesh / similar)

These are established facts here, not opinions. Apply them before the pitch gets sentimental:

- **Labor-savings pitches are dead.** Labor is ~$1–2/hr; a merchandiser is ~$150–400/month.
  "Save hours of data entry" is worth almost nothing. Automating cheap labor is a weak ROI story
  even when the automation works perfectly.
- **Sell error prevention and cashflow.** Stopping a blocked payment, a chargeback, or a container
  stuck at port is where real money is.
- **The AI is never the moat.** Extraction, summarization and classification are commodities. The
  domain rules, the workflow, the trust and the relationships are the moat.
- **Self-serve signup is not a go-to-market here.** Buying is relationship-driven, cycles are long.
- **Three paying customers beat a platform.** Wedge → prove willingness to pay → expand. Never build
  the nine-phase cathedral speculatively.

## For economic / policy proposals

Different questions, same ruthlessness. The ones that mattered on a real proposal:

- **Where does the money come from in a bad year?** ("If the government's 5% equity does not generate
  enough annual return, how is the remaining cashback funded?")
- **What happens when the invested assets lose value?**
- **Who bears the risk if the sponsor cannot cover the shortfall?**
- **What is the incentive to defect**, and what stops it?
- **What is the failure mode at scale** — does it get more stable or less?

A mechanism that only works when returns are positive is not a mechanism.

## Judge-panel mode

When asked for "judges' scores", run **independent** perspectives rather than one averaged voice —
they disagree, and the disagreement is the information:

- **The investor** — returns, moat, exit
- **The operator** — can this actually be run day to day
- **The customer** — would I switch, and what would I stop paying for
- **The skeptic** — what is the strongest argument this fails

Report each score separately **before** any blended number, and say where they diverge.

## Output shape

```
VERDICT: <n>/10 — <one sentence>

KILL-SHOT: <the single most likely cause of failure>

SCORES
  Problem severity     n/10 — <why>
  Willingness to pay   n/10 — <why>
  Moat                 n/10 — <why>
  Distribution         n/10 — <why>
  Execution risk       n/10 — <why>
  Timing               n/10 — <why>

WHAT'S ACTUALLY TRUE HERE
  <the market realities that constrain this specific idea>

THE NARROWER VERSION THAT WOULD WORK
  <the wedge — specific enough to start Monday>

WHAT WOULD CHANGE MY MIND
  <the evidence that would move the score>
```

That last section matters. A review with no falsification condition is just an opinion in a table.

## Related

- `bd-import-export-domain` — where the market realities come from
- `profile/01-how-i-work.md` — rule 10, he rates work and wants the hard version

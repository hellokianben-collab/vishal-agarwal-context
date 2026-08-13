---
name: brand-media-pipeline
description: >-
  Produce and place brand imagery and video for a personal or business site without burning paid
  generation credits or shipping assets that break — background cutouts done locally and free, when
  to generate versus edit versus self-host, thumbnail and reel handling, and the text-rendering
  limits. Use when adding photos or video to a site, making a portrait cutout or transparent
  background, generating hero/venture imagery, producing YouTube thumbnails, embedding Facebook or
  Instagram reels, or choosing between Higgsfield/HeyGen/local tooling. Carries the credit-saving
  default, the signed-URL trap, and the Bengali text-shaping limit.
---

# Brand media pipeline

Getting real, good-looking imagery onto a site — cheaply, and without shipping assets that expire.

---

## 1. Do it locally and free before you spend a credit

The default that saved real money: **a hero portrait cutout was produced locally, for free, rather
than through a paid generation service.**

| Job | Free / local first | Paid generation only if |
|---|---|---|
| Remove a background | local `rembg` / a segmentation model | the subject is genuinely un-segmentable |
| Crop, resize, recolour | Pillow / ImageMagick / `sharp` | never |
| Upscale | local upscaler | quality is visibly insufficient |
| A photo that does not exist | — | **this is the real case for generation** |
| Restyle an existing photo | — | when local edits can't get there |
| Talking-head / avatar video | — | always paid |

**Ask "can this be an edit instead of a generation?" first.** Most of what a brand site needs is an
edit.

Before generating anything, check the balance. Credits are finite and the owner notices.

The free path, end to end — this is what replaced a paid hero-portrait generation on 26 July 2026:

```bash
# 1. cut the subject out, locally, no credits
python -m pip install rembg pillow
python -c "
from rembg import remove; from PIL import Image
Image.open('portrait.jpg').convert('RGBA').save('/tmp/in.png')
open('cutout.png','wb').write(remove(open('/tmp/in.png','rb').read()))
"

# 2. size for the slot and ship webp with alpha
npx --yes sharp-cli -i cutout.png -o hero-cutout.webp resize 1200 --format webp

# 3. confirm the alpha channel actually survived
node -e "require('sharp')('hero-cutout.webp').metadata().then(m=>console.log(m.width,m.height,m.hasAlpha))"
```

```bash
# video: crop a landscape source to 9:16 for reels without distorting it
ffmpeg -i in.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920" -c:a copy out.mp4
```

## 2. Consistency beats fidelity

Four venture photos on one page must look like a set. Fix the frame, the light direction, the palette
and the crop **first**, then generate into that spec. Four individually beautiful images with
different lighting look worse than four merely-good consistent ones.

Practical: write the shared prompt scaffold once, vary only the subject clause.

## 3. Cutouts and framing

- Export cutouts as **`.webp` with alpha**. Meaningfully smaller than PNG, universally supported now.
- Place the cutout on a **brand-coloured frame** (an amber block, a cream→amber gradient) rather than
  leaving it floating on the page background. It reads as designed rather than as a sticker.
- Watch the crop at mobile widths — a cutout that is beautifully composed at 1440px often loses the
  face at 390px. Measure it (see `responsive-reveal-audit`), don't eyeball it.

## 4. Video: never hotlink a platform thumbnail

| Source | Thumbnail URL |
|---|---|
| YouTube | `https://i.ytimg.com/vi/<id>/hqdefault.jpg` — **permanent, safe to hardcode** |
| Facebook | `og:image` is **signed and expiring** (`oh=` / `oe=`) — **never hardcode** |
| Instagram | signed and expiring — never hardcode |

Two correct answers for Facebook/Instagram:

1. **Self-host** — download once, serve as `fb-<id>.jpg` from your own assets.
2. **Branded gradient placeholder** per card, cycling through 3–4 brand tones.

Both were built on a real site; **the gradient placeholder shipped**, because it never breaks, loads
instantly, and looks deliberate.

**Play in-page, always.** A visitor sent to YouTube does not come back. Both platforms embed in a
modal — branch on a `data-platform` attribute. Your CSP `frame-src` must list
`youtube-nocookie.com`/`youtube.com` **and** `www.facebook.com`, or the modal opens onto a blank box.

## 5. Thumbnails, when the goal is click-through

Judge them the way the audience does: **half a second, on a phone, while scrolling, next to eleven
competitors.** Not "is it nice".

- One idea. One focal point. Legible at 168px wide.
- Contrast against the platform's own UI, and against the competing thumbnails in the same feed.
- Score against **the channel's own CTR baseline**, not against a generic best practice.
- Ship a variant, measure, keep the winner. A thumbnail with no measured outcome taught you nothing.

## 6. Text in generated images — the hard limit

**Pillow in this environment has no `raqm`** (`PIL.features.check('raqm') == False`). It cannot shape
complex scripts. **Bengali renders as broken, unshaped glyphs.** There is no runtime workaround.

Options:
- Use a **Latin transliteration** in drafts, and say clearly that it is a placeholder.
- Render the text as **HTML/SVG over the image** instead of baking it in — better anyway, because it
  stays editable and accessible.
- Generate with a model that handles the script natively, and verify the output visually before
  shipping — models still garble non-Latin text routinely.

## 7. Serving

- **Cache-bust everything.** Assets served `immutable, max-age=31536000` need a `?v=N` or a new
  filename, or returning visitors keep last month's image for a year.
- Size for the slot. A 2752px source in a 400px card is wasted bytes on a Bangladeshi mobile
  connection — which is most of the audience.
- 9:16 for reels, 16:9 for YouTube, and let the container crop rather than distorting the asset.
- `loading="lazy"` below the fold; **never** on the hero image.

## 8. Tooling notes

- Generation MCPs (Higgsfield, HeyGen) are installed at **user scope** so they work in every folder.
  If one is missing from `/mcp`, that is a scoping problem — see `claude-code-setup-ops`.
- Large tool results get auto-persisted to a `tool-results/*.txt` file. **Decode those from disk**
  (`JSON.parse` → `Buffer.from(content,'base64')`) rather than pulling base64 through the
  conversation — it burns context for nothing.
- Design-tool file APIs commonly cap content around 256 KiB; larger images come back
  `truncated: true` and **decode to corrupt files**. Check the flag before writing bytes.

## 9. Checklist before shipping media

- [ ] Nothing hotlinked from a signed CDN URL (`oh=` / `oe=` / `?sig=` / `?expires=`)
- [ ] Every asset sized for its slot, not the source resolution
- [ ] `?v=N` bumped, or the filename changed, on any replaced asset
- [ ] Cutout crop checked at **390px** width, not just desktop
- [ ] `loading="lazy"` below the fold, **never** on the hero
- [ ] Video plays in-page; CSP `frame-src` lists every embed host used
- [ ] No baked-in Bengali text (Pillow cannot shape it here)
- [ ] Generated imagery of a real person is accurate to them — see `content-integrity-guard`

*Verified on this machine 26 July 2026 (local cutouts) and re-checked 13 August 2026.*

## Related

- `public-data-without-api-keys` — sourcing real video metadata to place
- `content-integrity-guard` — generated imagery of a real person is still a claim about them
- `responsive-reveal-audit` — verifying the crop at real device widths

---
name: public-data-without-api-keys
description: >-
  Pull real, accurate data from public web platforms without an API key or a login — YouTube video
  IDs and titles, Facebook post metadata via the crawler user-agent, and the general method of
  reading a page's embedded JSON state. Use when you need a creator's real video list, real titles,
  real thumbnails or post metadata for a website; when an API needs a key/quota/OAuth you don't have;
  when scraping the DOM returns nothing because content is lazy-loaded; or when deciding which
  thumbnail URLs are safe to hardcode. Carries which URLs are permanent versus signed-and-expiring,
  and the limits (Instagram, TikTok) you should report rather than fake.
---

# Getting real platform data without keys

The rule this serves: **never fabricate content for a real person's site.** If the video titles are
not real, don't ship video titles. These are the methods that made real data available without an
API key.

Public, published information only. Nothing behind a login, no rate-limit abuse, no bot-check
evasion.

---

## YouTube — video IDs and titles, no key

The DOM is lazy-loaded, so querying anchors returns nothing. The data is in the page's embedded
state.

**1. Get the IDs from `ytInitialData`:**

```js
// on https://www.youtube.com/@<handle>/videos
JSON.stringify(window.ytInitialData).match(/"videoId":"([\w-]{11})"/g)
```

Do **not** try to walk the JSON for paired title+id — the modern shape hides the pairing, and
attempts to reconstruct it produce mismatched titles, which is worse than no titles.

**2. Get title and ownership per ID from oEmbed** (public, no key, no quota):

```bash
curl -s "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>&format=json"
# → {"title": "...", "author_name": "...", "thumbnail_url": "..."}
```

**3. Filter on `author_name`.** A channel page can surface videos the channel does not own. Matching
the author name is what confirms authorship.

**Thumbnails are permanent and safe to hardcode:**

```
https://i.ytimg.com/vi/<ID>/hqdefault.jpg
```

## Facebook — post metadata via the crawler user-agent

Facebook serves **full Open Graph metadata server-side to its own crawler UA**, with no login, for
public posts.

```bash
curl -A "facebookexternalhit/1.1" "<reel-or-post-url>" \
  | grep -o '<meta property="og:[^>]*>'
```

Reading the result:

- `og:title` is formatted `"<views> · <reactions> | <caption> | <Page Name>"`.
  **Check the Page Name matches the owner** — that is how you confirm authorship.
- Some posts return an empty response on the first try. **Retry, or vary the UA string slightly.**
  Don't give up after one miss — this cost real content on a first pass.
- Watch the currency symbols: Bengali Taka `৳` is **U+09F3, inside the Bengali Unicode block**. On an
  English-only site, transliterate to `Tk` or you silently break a language rule.

### `og:image` is a trap — never hardcode it

Facebook's CDN thumbnail URLs are **signed and expiring** (`oh=` / `oe=` query params). Hardcoding
one gives you an image that works today and is a broken box next week.

Two correct options:

1. **Self-host** — download once, serve from your own assets (`fb-<id>.jpg`).
2. **Design around it** — a branded gradient placeholder per card. Often better: it is consistent,
   it never breaks, and it loads instantly.

Both were used on a real site; the gradient placeholder is what shipped.

## Playing the video in-page

Having real IDs, don't bounce the visitor off to the platform. Both embed:

```
YouTube   https://www.youtube-nocookie.com/embed/<id>
Facebook  https://www.facebook.com/plugins/video.php?href=<encoded-permalink>&autoplay=true
```

Branch on a `data-platform` attribute on the card. **Your CSP `frame-src` must list both**
`youtube-nocookie.com` / `youtube.com` and `www.facebook.com`, or the modal opens onto a blank box.

## The general method

For any platform that server-renders:

1. **Look for embedded JSON state** before touching the DOM — `window.__INITIAL_STATE__`,
   `ytInitialData`, `<script type="application/ld+json">`, `<script id="__NEXT_DATA__">`.
2. **Try the public oEmbed endpoint** — `/oembed?url=…&format=json`. Many platforms have one and it
   is stable, keyless and quota-free.
3. **Try the crawler user-agent** — sites serve rich OG metadata to crawlers they want indexing them.
4. **Check Open Graph / `<meta>` tags** — free, structured, designed to be read.
5. Only then consider the authenticated API.

## Know which URLs are permanent

| Source | Permanent? |
|---|---|
| `i.ytimg.com/vi/<id>/hqdefault.jpg` | **yes** — safe to hardcode |
| oEmbed `thumbnail_url` | yes |
| Facebook `og:image` (`oh=`/`oe=` params) | **no** — signed, expires |
| Instagram CDN URLs | **no** — signed, expires |
| Anything with `?token=`, `?sig=`, `?expires=` | **no** |

**Rule of thumb: a query string with a hash in it means the URL will die.** Self-host or design
around it.

## Where this method stops — report, don't fake

- **Instagram** requires a login for post listings. Not available this way.
- **TikTok** serves a bot-check. Not available this way, and **do not attempt to bypass it.**

When a platform is unavailable, the correct output is an **empty state on the page** and a line in
the handoff saying *"needs post URLs from you"*. It is not a plausible-looking list of invented
posts. That distinction is the entire point of this skill.

## Related

- `content-integrity-guard` — the rule this exists to serve
- `brand-media-pipeline` — what to do with the assets once you have them

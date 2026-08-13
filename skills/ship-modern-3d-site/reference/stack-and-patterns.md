# Phase 2–3 — Scaffold + build patterns

## Scaffold

```bash
npx create-next-app@latest <lowercase-name> --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack --yes
```

> **Gotcha — folder name.** create-next-app uses the target dir name as the npm package name and **rejects uppercase/spaces** ("name can only contain URL-friendly characters... can no longer contain capital letters"). If the project folder is e.g. `My Site 3`, scaffold into a valid-named subdir then hoist:
>
> ```bash
> npx create-next-app@latest webapp --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack --yes
> shopt -s dotglob && mv webapp/* . && rmdir webapp
> ```
>
> (dotglob moves hidden files like `.gitignore` too.) Then write CLAUDE.md (see setup ref — it gets clobbered if written before the move).

Add the libs (React-19 majors resolve cleanly, no `--legacy-peer-deps` needed):

```bash
npm install three@latest @react-three/fiber@latest @react-three/drei@latest motion@latest gsap@latest lenis@latest lucide-react@latest
npm install -D @types/three prettier prettier-plugin-tailwindcss
```

**Proven versions:** next 16.2.7 · react/react-dom 19.2.4 · @react-three/fiber 9.6.1 · @react-three/drei 10.7.7 · three 0.184.0 · motion 12.40.0 · gsap 3.15.0 · lenis 1.3.23.

## next.config.ts

Pin the workspace root, else a stray lockfile elsewhere on disk makes Next infer the wrong root:

```typescript
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
};
export default nextConfig;
```

## Tailwind v4 tokens (globals.css)

`@import "tailwindcss"` then map CSS variables into Tailwind utilities via `@theme inline`. Define tokens on `:root`; for a light/dark toggle add the class variant.

```css
@import "tailwindcss";
/* optional, for class-based light/dark toggle: */
@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: #0a0a0a;
  --foreground: #f5f5f5;
  --card: #111113;
  --muted: #161618;
  --muted-foreground: #8a8a8f;
  --border: #232327;
  --accent: #6e6af6;
  --accent-foreground: #fff;
  --ring: #6e6af6;
  color-scheme: dark;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-ring: var(--ring);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --font-display: var(--font-space-grotesk);
  --font-heavy: var(--font-clash);
}

:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* monospace bracket eyebrow */
.label-mono {
  font-family: var(--font-mono), monospace;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}

/* outlined display text (transparent fill + stroked glyphs) */
.text-outline {
  color: transparent;
  -webkit-text-stroke: 1.5px var(--outline-stroke, #111);
}
@media (min-width: 1024px) {
  .text-outline {
    -webkit-text-stroke-width: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

> After editing this token block, `bg-accent` etc. won't render until the dev cache is cleared — see verify-local. A pure-black `bg-#000` with no `--accent` is the tell-tale of stale CSS.

## Fonts (layout.tsx)

Google fonts via `next/font/google`, custom display face via `next/font/local`, each bound to a `--font-*` var on `<html>`:

```tsx
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const clashDisplay = localFont({
  src: [
    {
      path: "../../public/fonts/ClashDisplay-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/ClashDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-clash",
  display: "swap",
});
// <html className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${clashDisplay.variable} h-full antialiased`}>
// <body> wraps: <SmoothScroll><Nav /><main>{children}</main><Footer /></SmoothScroll>
```

## Single content file — `src/lib/content.ts`

One `as const` `site` object is the source of truth; every component imports from it. Editing the site = editing this file.

```ts
export const site = {
  calLink: "user/intro-call",            // Cal.com username/event-slug
  name, role, location, email,
  hero: { greeting, headlineFilled, headlineOutline, sub, ctaPrimary, ctaSecondary },
  about: { heading, paragraphs: string[], stats: { value, label }[] },
  expertise: { heading, sub, items: { icon, title, body }[] }, // icon = lucide name
  mentorship: { heading, sub, format: { duration, mode, price }, youGet: string[], forYou: string[] },
  testimonials: { heading, items: { quote, author, title }[] },
  booking: { heading, sub },
  socials: { label, href }[],
  nav: { label, href }[],
} as const;
export type Site = typeof site;
```

## Shared button classes — `src/lib/ui.ts`

```ts
export const btnPrimary =
  "inline-flex items-center justify-center rounded-full border border-foreground bg-foreground px-6 py-3 font-mono text-xs tracking-widest text-background uppercase transition-colors duration-300 hover:bg-transparent hover:text-foreground";
export const btnOutline =
  "inline-flex items-center justify-center rounded-full border border-border px-6 py-3 font-mono text-xs tracking-widest text-foreground uppercase transition-colors duration-300 hover:border-foreground";
```

## Component / animation patterns

### Reveal — the one scroll-reveal primitive (reuse everywhere)

```tsx
"use client";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Reveal({
  delay = 0,
  children,
  ...rest
}: HTMLMotionProps<"div"> & { delay?: number }) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE, delay: reduced ? 0 : delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
```

> **TS gotcha:** type bezier arrays as `[number,number,number,number]`, NOT `as const` — Motion's `ease` rejects a `readonly` tuple and the build fails.
> `Reveal` is not polymorphic; wrap real semantic tags inside it (`<Reveal><p>…</p></Reveal>`), don't pass `as="p"`.

### SmoothScroll — Lenis, off under reduced motion

```tsx
"use client";
import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion() ?? false;
  if (reduced) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
```

### HeroObject — R3F canvas that pauses offscreen (perf + screenshot fix)

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";

export default function HeroObject() {
  const reduced = useReducedMotion() ?? false;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // reduced motion OR ?still → one static frame; else animate only while visible
  const still =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("still");
  const frameloop = reduced || still ? "demand" : visible ? "always" : "never";
  return (
    <div ref={wrapRef} className="absolute inset-0">
      <Canvas
        frameloop={frameloop}
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        {/* <Knot/> uses useFrame gated on !reduced */}
      </Canvas>
    </div>
  );
}
```

Mount it via `dynamic(() => import("./HeroObject"), { ssr: false, loading: () => null })` from a client component. Wireframe materials (`meshBasicMaterial wireframe`) need no lights; for metallic looks bake a procedural env with drei `<Environment resolution={256} frames={1}>` + `<Lightformer>` (no runtime CDN fetch).

### Nav — responsive without cramping

Full links at `lg:flex`, hamburger `<lg:hidden`. Add `whitespace-nowrap` + `shrink-0` to the brand and links so wide mono/uppercase labels don't wrap inside the bar.

### A11y heading hierarchy

Every `<section>` needs a real `<h2>`. Don't style a `<p>` as the section title — it breaks heading order (h1 hero → h2 per section → h3 cards). This is a common WCAG miss when an eyebrow/`SectionLabel` (a `<span>`) is the only "title".

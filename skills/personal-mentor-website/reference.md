# Reference — Personal / Mentorship Website Builder

## Gotchas hit (save time)
- **framer-motion 12 `ease` typing**: an untyped `variants` object infers `ease: number[]` and
  fails the build. Annotate `const v: Variants = {...}` (import `type Variants`) — contextual
  typing then accepts the bezier tuple. Inline `transition={{ease:[...]}}` is fine (already typed).
- **Next.js public GET API routes prerender at build** and hit the DB → build fails with
  "Can't reach database server". Add `export const dynamic = "force-dynamic"` to any public GET
  route that queries the DB. Routes using `cookies()` are auto-dynamic.
- **Next 14.2.x security advisory (Dec 2025)**: pin `next@14.2.35` (latest 14.2 patch). Remaining
  `npm audit` flags only "fix" via next@16 (breaking, needs React 19 + r3f v9) — don't take it on
  a React-18/r3f-v8 stack; the exploitable one is already patched in 14.2.35.
- **react-three-fiber SSR**: import the Canvas component via `next/dynamic` with `ssr:false`.
  Use explicit lights (ambient + directional + point), NOT drei `Environment`/`Stage` (they fetch
  an HDRI at runtime → fails offline / on host).
- **Prisma narrowing**: property narrowing (e.g. `if(!b.trxId) return`) is lost inside a
  `$transaction` closure. Capture into a `const` before the closure.
- **gitignore**: `node_modules`, `.next`, `.env`, build artifacts, and Claude/agent files
  (`.agents`, `.claude`, `skills-lock.json`) must be ignored. The host runs `npm install` +
  build to regenerate them. `node_modules` is platform-specific (Prisma/three binaries) — never
  commit it.
- **Vercel serverless 4.5MB body limit**: base64 uploads of big images/videos/`.glb` FAIL on
  Vercel. Either keep uploads small, switch to direct browser→Cloudinary upload, or use Railway
  (no such limit). Railway also runs a start command (db push + seed) that Vercel can't.
- **Multer**: use `multer@^2.x` (1.x deprecated/vulnerable). Same diskStorage/`single` API.

## Env vars (full stack)
`DATABASE_URL` (Postgres), `AUTH_SECRET` (`openssl rand -base64 48`), `ADMIN_USERNAME`,
`ADMIN_PASSWORD`, `CLOUDINARY_CLOUD_NAME` + `_API_KEY` + `_API_SECRET` +
`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_SITE_URL`, optional `BKASH_*`
(BASE_URL/APP_KEY/APP_SECRET/USERNAME/PASSWORD).

## Simple stack — file map
```
package.json            deps: express, cookie-parser, multer@^2
server.js               static + JSON API + cookie auth + multer upload + seed-on-first-run
data.json               { settings, achievements[], goals[], videos[] } (auto-created)
public/index.html       site shell (containers filled by JS)
public/admin.html       login + tabbed admin
public/css/styles.css   dark+gold theme
public/js/main.js        fetch /api/content → render sections
public/js/admin.js       login/CRUD/upload/settings
public/assets/          owner photos (vishal-1.jpg hero, vishal-2.jpg about)
uploads/                admin-uploaded images (+ .gitkeep)
```

### Simple-stack key patterns
- Auth: compare against `ADMIN_PASSWORD`; on success set httpOnly cookie =
  `crypto.createHmac('sha256', AUTH_SECRET).update('admin-ok').digest('hex')`; `requireAuth`
  compares cookie to that constant. `GET /api/me` returns `{authed}`.
- Public `GET /api/content` returns settings + items filtered `visible !== false`.
- Generic collection factory registers `POST /api/admin/:name`, `PATCH /:id`, `DELETE /:id`
  for achievements/goals/videos, persisting to `data.json`.
- `POST /api/admin/upload` (multer single `file`) → `{url:'/uploads/<id>.<ext>'}`.
- Goal tasks edited by PATCHing the goal with a full new `tasks[]`.
- Image fallback: `img.onerror` → hide img, show "add your photo" placeholder.
- YouTube embed: extract 11-char id, iframe `youtube.com/embed/<id>`.

## Deploy
- **Railway (full stack)**: `railway.json` builder NIXPACKS; deploy startCommand
  `npx prisma db push --accept-data-loss && node prisma/seed.mjs && npm run start`. Add Postgres
  plugin (auto `DATABASE_URL`), set env vars, generate domain, put it in `NEXT_PUBLIC_SITE_URL`.
  `next start` auto-reads `PORT`.
- **Railway/Render (simple stack)**: host runs `npm install` then `npm start`. Set `ADMIN_PASSWORD`
  + `AUTH_SECRET`. Ephemeral disk resets `data.json`/`uploads` on redeploy — attach a volume for
  persistence, or it's fine for a low-stakes site.
- **Vercel (full stack)**: external Postgres (Neon); run `prisma db push` + seed once locally
  against prod DB (no startup command on serverless); import repo; set env vars; mind the 4.5MB
  upload limit.

## Vishal's concrete details (this owner)
- Name: Vishal Agarwal. Tagline: Business Mentor & Consultant. Email: mvishal550@gmail.com.
- Socials: FB page facebook.com/iamvishalagarwal, FB personal facebook.com/vishal.agarwal.9275,
  IG instagram.com/iamvishalagarwal, IG personal instagram.com/mvishal_agarwal,
  YouTube youtube.com/@iamvishalagarwal.
- Admin: `admin` / `@#VishalGlobal@#0407` (shared in chat — rotate after launch).
- Payment (full stack only): Bkash, manual TrxID verify + PGW drop-in. Owner sets number in admin.
- Two repos built: `Desktop/Vishal Agarwal Personal WEB` (full Next.js) and
  `Desktop/Final web vishal` (simple HTML/Node). Caveman comms mode preferred; honesty over filler.

# vercel.json + server.js snippets for a file-based Express app

Copy these verbatim and adjust the file lists.

## vercel.json — one function, everything routed through server.js

`includeFiles` is the line that fixes 404 static assets: it bundles the listed
files alongside the function so `res.sendFile(__dirname + '/...')` finds them.
List **only** the files you actually serve publicly (keep backend `.js` off the
list is unnecessary — routing controls exposure — but there's no reason to add
them), **plus the JSON data file** so it's a read-only fallback when
`DATABASE_URL` is unset.

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": [
          "kianben.json",
          "index.html",
          "admin.html",
          "styles.css",
          "admin.css",
          "main.js",
          "admin-panel.js",
          "logo.png",
          "logo.jpg",
          "robots.txt",
          "sitemap.xml"
        ]
      }
    }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "server.js" }
  ]
}
```

Why route *everything* to `server.js` rather than letting Vercel serve statics
directly: it preserves the app's existing whitelist logic (the server chooses
which files are public and which stay private), so backend source never leaks
even though it's in the bundle. Verify with
`curl -s -o /dev/null -w "%{http_code}" https://site/server.js` → the SPA
fallback returns `index.html` (200 HTML), not the source.

## server.js — guard app.listen + split cache headers

```js
// Static file sender: HTML revalidates so deploys appear instantly;
// css/js/images cache at the CDN (a new deployment busts the edge cache).
const sendStatic = (res, file) => {
  res.set('Cache-Control', file.endsWith('.html')
    ? 'no-cache'
    : 'public, max-age=3600, s-maxage=31536000');
  res.sendFile(path.join(__dirname, file));
};

FRONT_END.forEach(file => app.get(`/${file}`, (req, res) => sendStatic(res, file)));
app.get('/', (req, res) => sendStatic(res, 'index.html'));

// ... routes ...

app.get('*', (req, res) => sendStatic(res, 'index.html')); // SPA fallback

// On Vercel the exported app is invoked directly — listen() only for local dev.
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
}
module.exports = app;
```

## Env vars a typical app needs in Vercel production

Add each without printing the value:

```bash
printf '%s' "$VALUE" | vercel env add <NAME> production --scope <team-slug>
```

| Var | Why |
|---|---|
| `DATABASE_URL` | Postgres connection string → persistent storage (§3 of SKILL) |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail address + **App Password** → real email in prod |
| `SITE_URL` | `https://yourdomain` → correct links inside email bodies |
| `JWT_SECRET` / `ADMIN_JWT_SECRET` | sign member/admin tokens (don't ship fallback secrets) |
| `ADMIN_PASSWORD` | seeds the admin login on first boot |

After adding or changing env, **redeploy** — env changes don't apply to existing
deployments: `vercel deploy --prod -y --no-wait --scope <team>`.

## Local dev convenience

If the app writes its JSON store next to `server.js` and you use `nodemon`, it
will restart-loop on every write. Add `nodemon.json`:

```json
{ "ignore": ["kianben.json", "node_modules/*"] }
```

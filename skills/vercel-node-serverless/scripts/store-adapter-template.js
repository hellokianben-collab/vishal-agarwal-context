'use strict';
/* ═══════════════════════════════════════════════════════════════════
   DUAL-MODE STORE ADAPTER — template.

   The problem it solves: your app keeps data in a JSON file and writes
   it with fs.writeFileSync. That works locally but on Vercel serverless
   the disk is read-only/ephemeral, so every write is lost on the next
   cold start — logins fail, orders vanish, admin edits reset.

   The fix: one module that exposes the SAME function names your routes
   already call, backed by Postgres when DATABASE_URL is set (production)
   and your existing JSON layer otherwise (local dev). Routes change only
   `require('./db-init')` → `require('./store')` and `await` the calls.

   HOW TO ADAPT:
   1. Point `jsonDb` at your existing JSON data module and make sure the
      method names below match the ones your routes use. Delete/rename
      collections you don't have; add ones you do.
   2. Adjust `seed()` to mirror your JSON layer's first-run seeds (admin
      user, sample rows, default config) so both backends behave alike.
   3. `npm i pg` and add "pg" to package.json dependencies.
   4. Set DATABASE_URL in Vercel prod (Neon or Vercel Postgres) + redeploy.

   Design note: every collection is stored as JSONB rows in one table, so
   a single set of CRUD code serves all of them. Filtering is done in JS
   with case-insensitive string matching — fine for hundreds/thousands of
   rows (members, orders, applications), which is the scale these apps hit.
   If a collection ever grows large, give it a real table + indexed columns.
   ═══════════════════════════════════════════════════════════════════ */

const jsonDb = require('./db-init'); // ← your existing JSON data-access module

const PG_URL = process.env.DATABASE_URL || '';

const now = () => new Date().toISOString();
const match = (obj, cond) => Object.entries(cond).every(([k, v]) =>
  typeof v === 'string' && typeof obj[k] === 'string'
    ? obj[k].toLowerCase() === v.toLowerCase()
    : obj[k] === v);
const newestFirst = (a, b) => new Date(b.created_at) - new Date(a.created_at);

/* ── JSON branch — thin async wrappers over the existing sync layer ── */
const jsonStore = {
  mode: 'json',
  getMembers:         async (w)     => jsonDb.getMembers(w),
  getMember:          async (w)     => jsonDb.getMember(w),
  insertMember:       async (f)     => jsonDb.insertMember(f),
  updateMember:       async (id, f) => jsonDb.updateMember(id, f),
  deleteMember:       async (id)    => jsonDb.deleteMember(id),
  getApplications:    async (w)     => jsonDb.getApplications(w),
  getApplication:     async (w)     => jsonDb.getApplication(w),
  insertApplication:  async (f)     => jsonDb.insertApplication(f),
  updateApplication:  async (id, f) => jsonDb.updateApplication(id, f),
  deleteApplication:  async (id)    => jsonDb.deleteApplication(id),
  getOrders:          async (w)     => jsonDb.getOrders(w),
  getOrder:           async (w)     => jsonDb.getOrder(w),
  insertOrder:        async (f)     => jsonDb.insertOrder(f),
  updateOrder:        async (id, f) => jsonDb.updateOrder(id, f),
  deleteOrder:        async (id)    => jsonDb.deleteOrder(id),
  getAdmin:           async (w)     => jsonDb.getAdmin(w),
  insertAdmin:        async (f)     => jsonDb.insertAdmin(f),
  count:              async (t, w)  => jsonDb.count(t, w),
};

/* ── Postgres branch — generic JSONB tables ────────────────────────── */
function pgStore() {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: PG_URL,
    ssl: /localhost|127\.0\.0\.1/.test(PG_URL) ? false : { rejectUnauthorized: false },
    max: 3,
  });

  let ready = null;
  const init = () => {
    if (!ready) ready = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_records (
          collection TEXT  NOT NULL,
          id         INT   NOT NULL,
          data       JSONB NOT NULL,
          PRIMARY KEY (collection, id)
        );
        CREATE TABLE IF NOT EXISTS app_counters (
          collection TEXT PRIMARY KEY,
          n          INT  NOT NULL
        );
      `);
      await seed();
    })();
    return ready;
  };

  const nid = async (col) => {
    const { rows } = await pool.query(
      `INSERT INTO app_counters (collection, n) VALUES ($1, 1)
       ON CONFLICT (collection) DO UPDATE SET n = app_counters.n + 1
       RETURNING n`, [col]);
    return rows[0].n;
  };
  const all = async (col) => {
    const { rows } = await pool.query('SELECT data FROM app_records WHERE collection = $1', [col]);
    return rows.map(r => r.data);
  };
  const filtered = async (col, w = {}) => (await all(col)).filter(r => match(r, w));
  const insert = async (col, record) => {
    const id = await nid(col);
    const row = { id, ...record };
    await pool.query('INSERT INTO app_records (collection, id, data) VALUES ($1, $2, $3)', [col, id, row]);
    return row;
  };
  const update = async (col, id, patch) => {
    const { rows } = await pool.query('SELECT data FROM app_records WHERE collection = $1 AND id = $2', [col, id]);
    if (!rows.length) return null;
    const merged = { ...rows[0].data, ...patch };
    await pool.query('UPDATE app_records SET data = $3 WHERE collection = $1 AND id = $2', [col, id, merged]);
    return merged;
  };
  const del = async (col, id) => {
    await pool.query('DELETE FROM app_records WHERE collection = $1 AND id = $2', [col, id]);
  };

  /* Mirror your JSON layer's first-run seeds so both backends match. */
  async function seed() {
    const bcrypt = require('bcryptjs');
    if (!(await all('admins')).some(a => match(a, { username: 'admin' }))) {
      await insert('admins', {
        username: 'admin',
        password_hash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'change-me', 10),
        created_at: now(),
      });
    }
    // ...seed sample rows / default config here to match db-init.js...
  }

  return {
    mode: 'postgres',
    getMembers:  async (w = {}) => { await init(); return filtered('members', w); },
    getMember:   async (w)      => { await init(); return (await filtered('members', w))[0] || null; },
    insertMember:async (f)      => { await init(); return insert('members', { ...f, created_at: now() }); },
    updateMember:async (id, f)  => { await init(); return update('members', id, f); },
    deleteMember:async (id)     => { await init(); return del('members', id); },

    getApplications:   async (w = {}) => { await init(); return filtered('applications', w); },
    getApplication:    async (w)      => { await init(); return (await filtered('applications', w))[0] || null; },
    insertApplication: async (f)      => { await init(); return insert('applications', { ...f, status: 'pending', created_at: now() }); },
    updateApplication: async (id, f)  => { await init(); return update('applications', id, f); },
    deleteApplication: async (id)     => { await init(); return del('applications', id); },

    getOrders:   async (w = {}) => { await init(); return (await filtered('orders', w)).sort(newestFirst); },
    getOrder:    async (w)      => { await init(); return (await filtered('orders', w))[0] || null; },
    insertOrder: async (f)      => { await init(); return insert('orders', { ...f, status: 'pending', created_at: now() }); },
    updateOrder: async (id, f)  => { await init(); return update('orders', id, f); },
    deleteOrder: async (id)     => { await init(); return del('orders', id); },

    getAdmin:    async (w) => { await init(); return (await filtered('admins', w))[0] || null; },
    insertAdmin: async (f) => { await init(); return insert('admins', { ...f, created_at: now() }); },

    count: async (t, w = {}) => { await init(); return (await filtered(t, w)).length; },
  };
}

let store = jsonStore;
if (PG_URL) {
  try {
    store = pgStore();
    console.log('🗄️  Store: Postgres active');
  } catch (e) {
    console.error('Postgres init failed, using JSON store:', e.message);
  }
} else {
  console.log('🗄️  Store: JSON file (set DATABASE_URL for persistence on Vercel)');
}

module.exports = store;

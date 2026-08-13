#!/usr/bin/env node
/**
 * score-skills.mjs — reproducible skill scoring.
 *
 * Computes the 60-point MACHINE half of the rubric in ratings/RUBRIC.md by
 * inspecting the skill files themselves. Reads the 40-point HUMAN half from
 * ratings/human-scores.json, where every sub-score must carry a written
 * justification or it is refused.
 *
 * The point of this file: anyone can re-run it and get the same numbers.
 * A score you cannot recompute is an opinion wearing a number's clothes.
 *
 *   node tools/score-skills.mjs              # table to stdout
 *   node tools/score-skills.mjs --json       # machine-readable
 *   node tools/score-skills.mjs --write      # regenerate ratings/scores.json
 */

import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = join(ROOT, 'skills');

/* ------------------------------------------------------------------ helpers */

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const tier = (n, ...steps) => { // steps: [threshold, points] pairs, descending
  for (const [t, p] of steps) if (n >= t) return p;
  return 0;
};

function parseFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { ok: false, name: null, description: null, body: src };
  const block = m[1];
  const grab = (key) => {
    // NOTE: no 'm' flag — with it, `$` matches every line end and a lazy body
    // stops after the first line. That bug silently truncated every folded
    // description to ~90 chars and tanked the trigger score across the board.
    const re = new RegExp(`(?:^|\\n)${key}:[ \\t]*(?:>-|>|\\|-|\\|)?[ \\t]*\\r?\\n?([\\s\\S]*?)(?=\\n[a-zA-Z_][a-zA-Z0-9_-]*:|$)`);
    const g = block.match(re);
    if (!g) return null;
    return g[1].split('\n').map(l => l.trim()).join(' ').trim();
  };
  return { ok: true, name: grab('name'), description: grab('description'), body: src.slice(m[0].length) };
}

/* ------------------------------------------------------- machine dimensions */

// 1. TRIGGER QUALITY — 12
function scoreTrigger(fm) {
  let s = 0; const notes = [];
  if (fm.ok && fm.name && fm.description) s += 2; else notes.push('missing frontmatter name/description');

  const d = fm.description || '';
  if (d.length >= 200 && d.length <= 2000) s += 2;
  else if (d.length >= 120) { s += 1; notes.push(`description ${d.length} chars (want 200-2000)`); }
  else notes.push(`description only ${d.length} chars`);

  if (/\b(use (this )?(skill )?(when|whenever)|load this whenever|use it even for|trigger)\b/i.test(d)) s += 3;
  else notes.push('no explicit "use when" trigger clause');

  const quoted = (d.match(/"[^"]{4,}"/g) || []).length;
  s += tier(quoted, [3, 3], [2, 2], [1, 1]);
  if (quoted < 3) notes.push(`${quoted} quoted user-phrase triggers (want >=3)`);

  if (/\b(not for|not a substitute|rather than|instead of|for .{3,40} see|do not use)\b/i.test(d)) s += 2;
  else notes.push('no boundary / negative scope');

  return { score: clamp(s, 0, 12), max: 12, notes };
}

// 2. ACTIONABILITY — 12
function scoreActionability(body) {
  let s = 0; const notes = [];
  const fences = (body.match(/^```/gm) || []).length / 2;
  s += tier(fences, [6, 4], [3, 3], [1, 2]);
  if (fences < 3) notes.push(`${fences} code blocks`);

  const cmds = (body.match(/^\s*(\$ |curl |npm |npx |node |git |grep |vercel |claude |python |for )/gm) || []).length;
  s += tier(cmds, [12, 4], [6, 3], [2, 2], [1, 1]);
  if (cmds < 6) notes.push(`${cmds} runnable command lines`);

  const paths = (body.match(/`[\w./-]+\.(js|mjs|json|md|css|html|py|yaml|yml|sql)`/g) || []).length;
  s += tier(paths, [8, 2], [3, 1]);
  if (paths < 3) notes.push(`${paths} concrete file paths`);

  const proc = (body.match(/^\s*(\d+\.|- \[ \])/gm) || []).length;
  s += tier(proc, [8, 2], [3, 1]);
  if (proc < 3) notes.push('few numbered steps / checklist items');

  return { score: clamp(s, 0, 12), max: 12, notes };
}

// 3. EVIDENCE & SPECIFICITY — 10
function scoreEvidence(body) {
  let s = 0; const notes = [];
  const errs = (body.match(/`[^`\n]*(?:error|Invalid|cannot|failed|TOO_LARGE|9999|40[13]|50[023])[^`\n]*`/gi) || []).length
             + (body.match(/^```[\s\S]{0,400}?(?:Error|Invalid|No more than|You can only send)/gm) || []).length;
  s += tier(errs, [4, 3], [2, 2], [1, 1]);
  if (errs < 2) notes.push('few verbatim error strings');

  const dates = (body.match(/\b(\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)|20\d\d-\d\d-\d\d|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) 20\d\d)/g) || []).length;
  s += tier(dates, [3, 2], [1, 1]);
  if (dates < 1) notes.push('undated — decay risk invisible');

  const nums = (body.match(/\b\d{1,3}(,\d{3})+\b|\b\d+ (assertions|codes|rules|functions|files|days|MB|KiB)\b|\b\d+\/\d+\b|\b\d+%/g) || []).length;
  s += tier(nums, [8, 3], [4, 2], [1, 1]);
  if (nums < 4) notes.push(`${nums} measured quantities`);

  const causal = (body.match(/\b(gotcha|trap|cost (an hour|hours|real hours)|symptom|why:|because|the reason)\b/gi) || []).length;
  s += tier(causal, [6, 2], [2, 1]);
  if (causal < 2) notes.push('little symptom->cause reasoning');

  return { score: clamp(s, 0, 10), max: 10, notes };
}

// 4. STRUCTURE — 8
function scoreStructure(fm, body, dirName, dir) {
  let s = 0; const notes = [];
  if (fm.ok) s += 2; else notes.push('no YAML frontmatter block');
  if (fm.name === dirName) s += 2; else notes.push(`frontmatter name "${fm.name}" != directory "${dirName}"`);

  const h2 = (body.match(/^## /gm) || []).length;
  s += tier(h2, [4, 2], [2, 1]);
  if (h2 < 4) notes.push(`${h2} H2 sections`);

  const lines = body.split('\n').length;
  const hasRefs = ['references', 'reference', 'scripts', 'evals'].some(d => existsSync(join(dir, d)));
  if (lines <= 500 || hasRefs) s += 2;
  else notes.push(`${lines} lines with no references/ split — progressive disclosure missing`);

  return { score: clamp(s, 0, 8), max: 8, notes, lines };
}

// 5. PORTABILITY — 10  (scored against the skill's declared type)
function scorePortability(body, type) {
  let s = 0; const notes = [];
  const abs = (body.match(/[A-Z]:\\Users\\|\/c\/Users\//g) || []).length;

  if (type === 'portable') {
    if (abs === 0) s += 4;
    else { s += clamp(4 - abs, 0, 3); notes.push(`${abs} absolute machine paths in a portable skill`); }
  } else {
    // a project-context skill SHOULD pin exact locations
    if (abs >= 1) s += 4; else { s += 2; notes.push('project skill with no absolute location pinned'); }
  }

  if (/^\|.*\|/m.test(body) && /(stack|environment|where things live|identity|assumes|locations)/i.test(body)) s += 3;
  else notes.push('no stack/environment/identity table');

  const xrefs = (body.match(/`[a-z0-9-]+`(?= skill)|## Related[\s\S]{0,600}/gi) || []).length;
  s += tier(xrefs, [2, 3], [1, 2]);
  if (xrefs < 1) notes.push('no cross-references to sibling skills');

  return { score: clamp(s, 0, 10), max: 10, notes };
}

// 6. SAFETY HYGIENE — 8
const SECRET_PATTERNS = [
  /\bgh[pousr]_[A-Za-z0-9]{16,}/,          // GitHub tokens
  /\bre_[A-Za-z0-9_]{20,}/,                // Resend
  /\bsk-[A-Za-z0-9]{20,}/,                 // OpenAI-style
  /\b21st_sk_[A-Za-z0-9]{20,}/,
  /\bnpg_[A-Za-z0-9]{16,}/,                // Neon
  /postgres(ql)?:\/\/[^\s`"']*:[^\s`"'@]+@/, // conn string with a password
  /\bvca_[A-Za-z0-9]{20,}/,                // Vercel
  /\bxox[baprs]-[A-Za-z0-9-]{10,}/,        // Slack
];
function scoreSafety(body) {
  let s = 0; const notes = [];
  const hits = SECRET_PATTERNS.filter(re => re.test(body));
  if (hits.length === 0) s += 5;
  else notes.push(`SECRET-SHAPED STRING PRESENT (${hits.length} pattern class(es)) — must be removed`);

  const cautions = (body.match(/\b(never|must not|do not|do NOT|non-negotiable|fail closed|irreversible)\b/g) || []).length;
  s += tier(cautions, [8, 3], [4, 2], [1, 1]);
  if (cautions < 4) notes.push('few explicit prohibitions');

  return { score: clamp(s, 0, 8), max: 8, notes };
}

/* ------------------------------------------------------------------- driver */

const manifest = JSON.parse(readFileSync(join(ROOT, 'skills', 'manifest.json'), 'utf8'));
const humanPath = join(ROOT, 'ratings', 'human-scores.json');
const human = existsSync(humanPath) ? JSON.parse(readFileSync(humanPath, 'utf8')) : {};

const HUMAN_DIMS = { failureModes: 15, reuseLeverage: 15, maintenance: 10 };

const rows = [];
for (const dirName of readdirSync(SKILLS).sort()) {
  const dir = join(SKILLS, dirName);
  if (!statSync(dir).isDirectory()) continue;
  const file = join(dir, 'SKILL.md');
  if (!existsSync(file)) continue;

  const src = readFileSync(file, 'utf8');
  const fm = parseFrontmatter(src);
  const entry = manifest.skills.find(s => s.name === dirName) || {};
  const type = entry.type || 'portable';

  const dims = {
    trigger:       scoreTrigger(fm),
    actionability: scoreActionability(fm.body),
    evidence:      scoreEvidence(fm.body),
    structure:     scoreStructure(fm, fm.body, dirName, dir),
    portability:   scorePortability(fm.body, type),
    safety:        scoreSafety(fm.body),
  };
  const machine = Object.values(dims).reduce((a, d) => a + d.score, 0);

  const h = human[dirName];
  let humanTotal = null, humanDetail = null, humanError = null;
  if (h) {
    humanDetail = {};
    let t = 0;
    for (const [k, max] of Object.entries(HUMAN_DIMS)) {
      const v = h[k];
      if (!v || typeof v.score !== 'number' || !v.why || v.why.length < 15) {
        humanError = `human score "${k}" missing a >=15-char justification — refused`;
        break;
      }
      const sc = clamp(v.score, 0, max);
      humanDetail[k] = { score: sc, max, why: v.why };
      t += sc;
    }
    if (!humanError) humanTotal = t;
  }

  rows.push({
    name: dirName, type, origin: entry.origin || 'unknown',
    lines: dims.structure.lines,
    machine, machineMax: 60,
    human: humanTotal, humanMax: 40, humanDetail, humanError,
    total: humanTotal === null ? null : machine + humanTotal,
    dims,
    flags: Object.values(dims).flatMap(d => d.notes),
  });
}

const band = (t) =>
  t === null ? '—' : t >= 90 ? 'A  exceptional' : t >= 80 ? 'B  strong' :
  t >= 70 ? 'C  solid' : t >= 60 ? 'D  usable, gaps' : 'F  needs work';

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ generated: null, rows }, null, 2));
} else if (process.argv.includes('--write')) {
  writeFileSync(join(ROOT, 'ratings', 'scores.json'), JSON.stringify({ rows }, null, 2));
  console.log(`wrote ratings/scores.json (${rows.length} skills)`);
} else {
  const pad = (s, n) => String(s).padEnd(n);
  console.log(pad('SKILL', 32) + pad('TYPE', 10) + pad('MACH/60', 9) + pad('HUM/40', 8) + pad('TOTAL', 7) + 'BAND');
  console.log('-'.repeat(90));
  for (const r of [...rows].sort((a, b) => (b.total ?? -1) - (a.total ?? -1))) {
    console.log(
      pad(r.name, 32) + pad(r.type, 10) + pad(r.machine, 9) +
      pad(r.human ?? '—', 8) + pad(r.total ?? '—', 7) + band(r.total)
    );
  }
  const scored = rows.filter(r => r.total !== null);
  const avg = scored.length ? (scored.reduce((a, r) => a + r.total, 0) / scored.length).toFixed(1) : '—';
  console.log('-'.repeat(90));
  console.log(`${rows.length} skills · ${scored.length} fully scored · mean total ${avg}/100`);
  const unsafe = rows.filter(r => r.dims.safety.score < 5);
  if (unsafe.length) console.log(`\n!! SECRET-SHAPED CONTENT in: ${unsafe.map(r => r.name).join(', ')}`);
  for (const r of rows) if (r.humanError) console.log(`!! ${r.name}: ${r.humanError}`);
}

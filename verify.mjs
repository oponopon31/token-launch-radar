// Verify a built token-radar-01 output directory against the gate.
// Usage: node verify.mjs <out-dir> <snapshot.json>
// Prints PASS/FAIL per check and exits non-zero on any failure.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from '../token-radar-01-kit/starter/vendor/makefun-board.ts';

const outDir = process.argv[2];
const snapshotPath = process.argv[3];
let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

const snap = JSON.parse(readFileSync(snapshotPath, 'utf8'));
const watchlist = new Set(snap.watchlist);
const slugs = new Set(snap.protocols.map((p) => p.slug));

// --- board.json ---
const board = JSON.parse(readFileSync(join(outDir, 'board.json'), 'utf8'));
const rows = board.rows;
check('board rows 100..4000', rows.length >= 100 && rows.length <= 4000, `${rows.length} rows`);
check('board.json <= 8 MiB', statSync(join(outDir, 'board.json')).size <= 8 * 1024 * 1024, `${statSync(join(outDir, 'board.json')).size} bytes`);
const missing = [...watchlist].filter((s) => !rows.some((r) => r.slug === s));
check('watchlist coverage 40/40', missing.length === 0, missing.length ? `missing: ${missing.join(', ')}` : 'all 40 present');
const ranks = rows.map((r) => r.rank).sort((a, b) => a - b);
check('ranks exactly 1..N', ranks.every((r, i) => r === i + 1));
let ordered = true;
for (let i = 1; i < rows.length; i++) if (rows[i].implied_value_usd > rows[i - 1].implied_value_usd) ordered = false;
check('implied values non-increasing', ordered);
check('not all implied values equal', new Set(rows.map((r) => r.implied_value_usd)).size > 1, `range $${rows[rows.length - 1].implied_value_usd.toLocaleString()} .. $${rows[0].implied_value_usd.toLocaleString()}`);
const badSlug = rows.find((r) => !slugs.has(r.slug));
check('every slug in snapshot', !badSlug, badSlug ? badSlug.slug : '');
const dupSlug = rows.length !== new Set(rows.map((r) => r.slug)).size;
check('slugs unique', !dupSlug);
let stepsOk = true;
let stepDetail = '';
for (const r of rows) {
  if (r.farm_steps.length < 3 || r.farm_steps.length > 12) { stepsOk = false; stepDetail = `${r.slug}: ${r.farm_steps.length} steps`; break; }
  for (const s of r.farm_steps) {
    const t = s.trim();
    if (t.length < 20 || t.length > 600) { stepsOk = false; stepDetail = `${r.slug}: step ${t.length} chars`; break; }
  }
  if (!stepsOk) break;
  if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0 || r.implied_value_usd > 1e14) { stepsOk = false; stepDetail = `${r.slug}: bad implied value`; break; }
  if (typeof r.name !== 'string' || r.name.length === 0) { stepsOk = false; stepDetail = `${r.slug}: empty name`; break; }
}
check('farm steps 3..12, 20..600 chars, valid values', stepsOk, stepDetail);

// --- dashboard ---
const dashDir = join(outDir, 'dashboard');
const dashFiles = [];
(function walk(dir, rel) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) walk(join(dir, e.name), p);
    else if (e.isFile()) dashFiles.push(p);
  }
})(dashDir, '');
const dashBytes = dashFiles.reduce((n, f) => n + statSync(join(dashDir, f)).size, 0);
check('dashboard has index.html', dashFiles.includes('index.html'));
check('dashboard has >=1 css', dashFiles.some((f) => f.endsWith('.css')));
check('dashboard has >=1 js', dashFiles.some((f) => f.endsWith('.js')));
check('dashboard <= 400 files / <= 4 MiB', dashFiles.length <= 400 && dashBytes <= 4 * 1024 * 1024, `${dashFiles.length} files, ${dashBytes} bytes`);
let netUrl = null;
for (const f of dashFiles) {
  const text = readFileSync(join(dashDir, f), 'utf8');
  const m = text.match(/https?:\/\/[^\s"'<>)]+/);
  if (m) { netUrl = `${f}: ${m[0].slice(0, 60)}`; break; }
}
check('no http(s) URLs in dashboard source', netUrl === null, netUrl ?? '');
check('dashboard source <= 64 KiB (dossier text)', dashBytes <= 64 * 1024, `${dashBytes} bytes`);

// --- screenshots ---
const shotsDir = join(outDir, 'screenshots');
const shots = readdirSync(shotsDir).filter((f) => !f.startsWith('.')).sort();
check('screenshots 3..4', shots.length >= 3 && shots.length <= 4, `${shots.length} images`);
for (const s of shots) {
  const buf = readFileSync(join(shotsDir, s));
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  let dims = '';
  if (isPng) {
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    dims = `${w}x${h}`;
    check(`screenshot ${s} PNG ${dims}, long<=1440 short>=800, <=512KiB`, Math.max(w, h) <= 1440 && Math.min(w, h) >= 800 && buf.length <= 524288, `${buf.length} bytes`);
  } else if (isJpeg) {
    let w = 0, h = 0, i = 2;
    while (i < buf.length - 1) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        h = buf.readUInt16BE(i + 5); w = buf.readUInt16BE(i + 7); break;
      }
      const len = buf.readUInt16BE(i + 2);
      i += 2 + len;
    }
    dims = `${w}x${h}`;
    check(`screenshot ${s} JPEG ${dims}, long<=1440 short>=800, <=512KiB`, w > 0 && Math.max(w, h) <= 1440 && Math.min(w, h) >= 800 && buf.length <= 524288, `${buf.length} bytes`);
  } else {
    check(`screenshot ${s} is PNG or JPEG`, false);
  }
}

// --- dossier ---
const dossierPath = join(outDir, 'dossier.json');
check('dossier.json exists', existsSync(dossierPath));
if (existsSync(dossierPath)) {
  const actual = readFileSync(dossierPath);
  const expected = Buffer.from(buildDossier(outDir, { text_max_bytes: 65536, screenshots: { max: 4, max_bytes: 524288 }, dashboard: { max_files: 400, max_bytes: 4194304 } }));
  check('dossier.json byte-identical to buildDossier', actual.equals(expected), `${actual.length} bytes vs ${expected.length} bytes`);
  check('dossier.json <= 1.5 MiB', actual.length <= 1.5 * 1024 * 1024, `${actual.length} bytes`);
  const doc = JSON.parse(actual.toString('utf8'));
  const textBytes = Buffer.byteLength(doc.text, 'utf8');
  check('dossier text <= 65536 bytes', textBytes <= 65536, `${textBytes} bytes`);
  check('dossier text has no cut line', !doc.text.includes('[Cut at'), doc.text.includes('[Cut at') ? 'SOURCE WAS CUT — shrink dashboard' : 'full source shown');
}

// --- data.js sanity ---
const dataText = readFileSync(join(outDir, 'data.js'), 'utf8');
check('data.js sets window.RADAR', dataText.startsWith('window.RADAR='));
const radar = JSON.parse(dataText.slice('window.RADAR='.length).replace(/;\s*$/, ''));
check('data.js rows match board', radar.rows.length === rows.length && radar.rows.every((r, i) => r.slug === rows[i].slug && r.implied_value_usd === rows[i].implied_value_usd));

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);

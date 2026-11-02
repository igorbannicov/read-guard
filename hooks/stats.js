// Token savings of read-guard: whole reads it denied minus the parts of those files read afterwards.
// A file denied several times in one session counts once.
const fs = require('fs');
const path = require('path');
const { logFile } = require('./common');

let entries = [];
try { entries = fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch {}
if (!entries.length) { console.log('read-guard: nothing saved yet.'); process.exit(); }

const num = n => n.toLocaleString('en-US');

function sum(list) {
  const seen = new Set();
  let blocked = 0, parts = 0, reads = 0;
  for (const e of list) {
    if (e.kind === 'part') { parts += e.tokens; continue; }
    const key = e.session + '|' + e.file;
    if (seen.has(key)) continue;
    seen.add(key); blocked += e.tokens; reads++;
  }
  return { reads, blocked, parts, saved: blocked - parts };
}

const row = (name, s) => `${name.padEnd(10)}${String(s.reads).padStart(8)}${num(s.blocked).padStart(14)}` +
  `${num(s.parts).padStart(12)}${num(s.saved).padStart(12)}${(s.blocked ? Math.round(100 * s.saved / s.blocked) : 0).toString().padStart(6)}%`;

const day = 24 * 3600 * 1000, now = Date.now();
console.log('read-guard: estimated tokens (~4 chars per token)\n');
console.log(`${'Period'.padEnd(10)}${'Denied'.padStart(8)}${'Whole files'.padStart(14)}${'Parts read'.padStart(12)}${'Saved'.padStart(12)}${'Saved'.padStart(7)}`);
console.log(row('Today', sum(entries.filter(e => e.t > new Date().setHours(0, 0, 0, 0)))));
console.log(row('7 days', sum(entries.filter(e => e.t > now - 7 * day))));
console.log(row('All time', sum(entries)));

const byFile = {};
for (const e of entries) (byFile[e.file] ??= []).push(e);
const top = Object.entries(byFile).map(([f, list]) => [f, sum(list)]).sort((a, b) => b[1].saved - a[1].saved).slice(0, 5);
console.log('\nTop files');
for (const [f, s] of top) console.log(`  ${num(s.saved).padStart(10)}  ${path.basename(path.dirname(f))}/${path.basename(f)}`);

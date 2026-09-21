#!/usr/bin/env node
/**
 * scripts/cleanup.js - removes transient media/temp artifacts.
 *
 * Keep this maintenance command outside lib/: lib/ contains reusable runtime modules,
 * while scripts/ contains executable repository maintenance tasks.
 * It only deletes regenerable scratch data; session/ and general data files remain untouched.
 */
const fs = require('fs');
const { DATA_DIR, TMP_DIR, TEMP_DIR, STATUS_DIR, STORE_FILE } = require('../lib/paths');

// Paths are shared with the bot through lib/paths.js; this command only decides what to prune.
const TARGETS = [TMP_DIR, TEMP_DIR, STATUS_DIR];

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h - keep anything recent (may still be in use)

let removed = 0;
let bytes = 0;

function prune(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name === '.gitkeep') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      prune(full);
      try {
        if (fs.readdirSync(full).length === 0) fs.rmdirSync(full);
      } catch {}
      continue;
    }
    let st;
    try { st = fs.statSync(full); } catch { continue; }
    if (Date.now() - st.mtimeMs < MAX_AGE_MS) continue;
    try {
      fs.unlinkSync(full);
      removed++;
      bytes += st.size;
    } catch (err) {
      console.warn(`[cleanup] could not remove ${e.name}: ${err.message}`);
    }
  }
}

for (const t of TARGETS) {
  if (fs.existsSync(t)) prune(t);
}

// clear any leftover atomic-write sidecars
for (const base of [STORE_FILE, DATA_DIR]) {
  try {
    const dir = fs.statSync(base).isDirectory() ? base : path.dirname(base);
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.tmp') || f.includes('.corrupt.')) {
        try {
          const p = path.join(dir, f);
          bytes += fs.statSync(p).size;
          fs.unlinkSync(p);
          removed++;
        } catch {}
      }
    }
  } catch {}
}

console.log(
  `[cleanup] removed ${removed} file(s), freed ${(bytes / 1024).toFixed(1)} KB`
);

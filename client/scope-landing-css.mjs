// Scopes the landing page CSS under .landing so it never clashes with the
// app's own styles. Regenerate after editing Front/src/index.css:
//   node scope-landing-css.mjs ../Front/src/index.css ./src/landing.css
//
// Character-level parser: handles single-line rules, multi-line rules,
// @media nesting and @keyframes (whose inner selectors must NOT be scoped).
import { readFileSync, writeFileSync } from 'fs';

const [, , srcPath, outPath] = process.argv;
if (!srcPath || !outPath) {
  console.error('Usage: node scope-landing-css.mjs <in.css> <out.css>');
  process.exit(1);
}

const css = readFileSync(srcPath, 'utf8');

// Selectors that must become the wrapper itself (html/body/:root can't be nested)
const MAP = { ':root': '.landing', html: '.landing', body: '.landing' };

function scopeSelector(raw) {
  const clean = raw.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!clean) return null;
  return clean
    .split(',')
    .map((p) => {
      const sel = p.trim();
      if (MAP[sel]) return MAP[sel];
      if (sel.startsWith('@')) return sel;
      return '.landing ' + sel;
    })
    .join(', ');
}

let out = '';
let buf = '';
let depth = 0;
let kfDepth = -1; // depth at which the current @keyframes block opened

for (let i = 0; i < css.length; i++) {
  const ch = css[i];

  // Copy comments verbatim
  if (ch === '/' && css[i + 1] === '*') {
    const end = css.indexOf('*/', i + 2);
    const stop = end === -1 ? css.length : end + 2;
    out += css.slice(i, stop);
    i = stop - 1;
    continue;
  }

  if (ch === '{') {
    const sel = buf.trim();
    buf = '';
    if (sel.startsWith('@')) {
      if (sel.startsWith('@keyframes')) kfDepth = depth;
      out += sel + ' {';
    } else if (kfDepth >= 0) {
      // Inside @keyframes — frames like 0%/from must stay unscoped
      out += sel + ' {';
    } else {
      out += (scopeSelector(sel) ?? sel) + ' {';
    }
    depth++;
    continue;
  }

  if (ch === '}') {
    out += buf + ch;
    buf = '';
    depth--;
    if (kfDepth >= 0 && depth <= kfDepth) kfDepth = -1;
    continue;
  }

  if (ch === ';') {
    // End of a declaration — selector buffer resets
    out += buf + ch;
    buf = '';
    continue;
  }

  buf += ch;
}

out += buf;

writeFileSync(outPath, out, 'utf8');
console.log(`✅ Scoped CSS written: ${outPath}`);

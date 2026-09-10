// Repairs files corrupted by PowerShell 5.1 reading UTF-8 as ANSI/CP1252.
// It inverts the damage exactly: chars -> CP1252 bytes -> decode as UTF-8.
// Run: node repair-mojibake.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOTS = ['./client/src', './server/src'];

// CP1252 bytes 0x80-0x9F that .NET maps to special characters
const CP1252_HIGH = new Map([
  [0x80, 0x20ac], [0x82, 0x201a], [0x83, 0x0192], [0x84, 0x201e],
  [0x85, 0x2026], [0x86, 0x2020], [0x87, 0x2021], [0x88, 0x02c6],
  [0x89, 0x2030], [0x8a, 0x0160], [0x8b, 0x2039], [0x8c, 0x0152],
  [0x8e, 0x017d], [0x91, 0x2018], [0x92, 0x2019], [0x93, 0x201c],
  [0x94, 0x201d], [0x95, 0x2022], [0x96, 0x2013], [0x97, 0x2014],
  [0x98, 0x02dc], [0x99, 0x2122], [0x9a, 0x0161], [0x9b, 0x203a],
  [0x9c, 0x0153], [0x9e, 0x017e], [0x9f, 0x0178],
]);
// Bytes .NET CP1252 leaves as C1 control characters
const IDENT = new Set([0x81, 0x8d, 0x8f, 0x90, 0x9d]);

// char code -> original byte (inverse of CP1252 decode)
const REV = new Map();
for (const [b, c] of CP1252_HIGH) REV.set(c, b);
for (const b of IDENT) REV.set(b, b);
for (let b = 0x00; b <= 0x7f; b++) REV.set(b, b);
for (let b = 0xa0; b <= 0xff; b++) REV.set(b, b);

function repair(text) {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.codePointAt(i);
    if (REV.has(code)) {
      bytes[i] = REV.get(code);
    } else if (code <= 0xff) {
      bytes[i] = code;
    } else {
      throw new Error(`char U+${code.toString(16)} at ${i} is not CP1252-representable`);
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

// Mojibake signatures (CP1252 renderings of UTF-8 lead bytes)
const DAMAGED = /[\u00e2\u00c3\u00f0\u00ef][\u0080-\u00ff\u20ac\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u017d\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u017e\u0178]/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(jsx?|css|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

for (const root of ROOTS) {
  for (const f of walk(root)) {
    let content = readFileSync(f, 'utf8');
    if (content.charCodeAt(0) === 0xfeff) content = content.slice(1); // strip BOM

    if (!DAMAGED.test(content)) {
      console.log(`clean  : ${f}`);
      continue;
    }

    let fixed;
    try {
      fixed = repair(content);
    } catch (err) {
      console.log(`ERROR  : ${f} -> ${err.message}`);
      continue;
    }

    if (DAMAGED.test(fixed)) {
      console.log(`WARN   : ${f} still looks damaged - NOT saved`);
      continue;
    }

    writeFileSync(f, fixed, 'utf8');
    console.log(`FIXED  : ${f}`);
  }
}
console.log('repair pass complete');

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const files = ['rw', 'en', 'fr', 'sw', 'rn', 'ln', 'lg'];
const extractKeys = (code) => {
  const raw = readFileSync(resolve(process.cwd(), `src/i18n/${code}.ts`), 'utf8');
  const start = raw.indexOf(`export const ${code}`);
  if (start === -1) throw new Error(`Could not find export const ${code} in ${code}.ts`);
  const body = raw.slice(start);
  const blockEnd = code === 'rw' ? body.indexOf('} as const;') : body.indexOf('} satisfies');
  if (blockEnd === -1) throw new Error(`Could not find closing brace for ${code}`);
  const chunk = body.slice(0, blockEnd);
  const keys = [];
  for (const line of chunk.split('\n')) {
    const match = line.match(/^\s{2}([a-zA-Z0-9_]+)\s*:/);
    if (match) keys.push(match[1]);
  }
  return keys;
};

const baseKeys = extractKeys('rw');
const baseSet = new Set(baseKeys);
let hasError = false;

for (const lang of files) {
  const keys = extractKeys(lang);
  const keySet = new Set(keys);
  const missing = baseKeys.filter((k) => !keySet.has(k));
  const extra = keys.filter((k) => !baseSet.has(k));
  if (missing.length || extra.length) {
    hasError = true;
    console.error(`[${lang}] missing=${missing.join(',')} extra=${extra.join(',')}`);
  } else {
    console.log(`[${lang}] OK (${keys.length} keys)`);
  }
}

if (hasError) process.exit(1);
console.log(`All 7 language files match ${baseKeys.length} keys.`);

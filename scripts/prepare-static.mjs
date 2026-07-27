/**
 * Prepares the tree for the GitHub Pages export.
 *
 * `output: 'export'` cannot coexist with `force-dynamic` segments or with route
 * handlers, so this script rewrites the segment config and moves the API
 * directory aside. The Mini App keeps working because every client screen goes
 * through `apiFetch`, which is redirected to the in-browser shim.
 *
 * Run `node scripts/prepare-static.mjs --restore` to undo it locally.
 */
import { readdir, readFile, writeFile, rename, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appDir = join(root, 'src', 'app');
const apiDir = join(appDir, 'api');
const apiParked = join(root, '.api-parked');

const restore = process.argv.includes('--restore');

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) yield full;
  }
}

const FROM = "export const dynamic = 'force-dynamic';";
const TO = "export const dynamic = 'force-static';";

async function rewriteSegments(from, to) {
  let count = 0;
  for await (const file of walk(appDir)) {
    const source = await readFile(file, 'utf8');
    if (!source.includes(from)) continue;
    await writeFile(file, source.replaceAll(from, to));
    count += 1;
  }
  return count;
}

// The API directory is parked before any rewriting and restored after it, so
// route handlers are never touched and the operation is exactly reversible.
if (restore) {
  if (await exists(apiParked)) await rename(apiParked, apiDir);
  const count = await rewriteSegments(TO, FROM);
  console.log(`Restored ${count} route segments and the API directory.`);
} else {
  if (await exists(apiDir)) await rename(apiDir, apiParked);
  const count = await rewriteSegments(FROM, TO);
  console.log(`Prepared ${count} route segments for static export; API routes parked.`);
}

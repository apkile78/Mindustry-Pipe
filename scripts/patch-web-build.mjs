#!/usr/bin/env node
import { mkdir, readFile, rm, writeFile, cp, readdir, stat } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = new Map(process.argv.slice(2).map((arg, index, all) => arg.startsWith('--') ? [arg, all[index + 1]] : []));
const input = join(root, args.get('--input') || process.env.WEB_INPUT_DIR || 'legacy-web');
const out = join(root, args.get('--out') || process.env.WEB_DIST_DIR || 'dist');
const textExts = new Set(['.html', '.js', '.css', '.json', '.txt', '.xml', '.atlas', '.properties']);

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function rewriteAbsoluteAssetPaths(source) {
  return source
    .replace(/(["'`(=:\s])\/(assets|html|maps|sprites|sounds|music|bundles|mods)\//g, '$1./$2/')
    .replace(/url\(\s*\/([^\s)]+)\s*\)/g, 'url(./$1)');
}

function injectHeadFirst(html) {
  const coi = '<script src="coi-serviceworker.js"></script>';
  const idb = '<script src="indexeddb-storage-shim.js"></script>';
  let next = html.replace(/<script\s+[^>]*src=["'](?:\.\/)?coi-serviceworker\.js["'][^>]*><\/script>\s*/i, '')
    .replace(/<script\s+[^>]*src=["'](?:\.\/)?indexeddb-storage-shim\.js["'][^>]*><\/script>\s*/i, '');
  next = next.replace(/<head([^>]*)>/i, `<head$1>\n    ${coi}\n    ${idb}`);
  if (!/<meta\s+charset=/i.test(next)) next = next.replace(coi, `${coi}\n    <meta charset="UTF-8">`);
  if (!/<title>/i.test(next)) next = next.replace(/<head([^>]*)>/i, '<head$1>\n    <title>Mindustry: Web Edition (Revived)</title>');
  return next;
}

async function patchTextFile(file) {
  const before = await readFile(file, 'utf8');
  let after = rewriteAbsoluteAssetPaths(before);
  if (extname(file).toLowerCase() === '.html') after = injectHeadFirst(after);
  if (after !== before) await writeFile(file, after);
}

async function main() {
  if (!await exists(input)) throw new Error(`Input web export not found: ${relative(root, input)}`);
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await cp(input, out, { recursive: true });
  await cp(join(root, 'public/coi-serviceworker.js'), join(out, 'coi-serviceworker.js'));
  await cp(join(root, 'public/indexeddb-storage-shim.js'), join(out, 'indexeddb-storage-shim.js'));

  for (const file of await walk(out)) {
    if (textExts.has(extname(file).toLowerCase())) await patchTextFile(file);
  }
  console.log(`Patched web build into ${relative(root, out)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

/**
 * Renders every route to static files. The desktop app ships the output and
 * serves it from a loopback server, so the packaged app and the website are the
 * same pages built from the same components — there is no second implementation
 * of anything to drift.
 */
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { TESTS } from '@d3vices/tests/registry';
import app from './app.js';

const outDir = process.argv[2] || join(import.meta.dir, '../../../dist/site');

const ROUTES = ['/', '/about', '/privacy', '/download', ...TESTS.map((t) => `/${t.slug}`)];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const route of ROUTES) {
  const response = await app.fetch(new Request(`http://localhost${route}`));
  if (!response.ok) throw new Error(`${route} returned ${response.status}`);
  const html = await response.text();
  const file = route === '/' ? 'index.html' : `${route.slice(1)}.html`;
  const target = join(outDir, file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html);
}

// The 404 page, so an unknown path in the desktop app still renders the site.
const notFound = await app.fetch(new Request('http://localhost/__not_found__'));
await writeFile(join(outDir, '404.html'), await notFound.text());

await cp(join(import.meta.dir, '../public/static'), join(outDir, 'static'), { recursive: true });

console.log(`[export] ${ROUTES.length + 1} pages + static assets -> ${outDir}`);

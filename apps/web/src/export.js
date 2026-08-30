/**
 * Renders every route to static files. The desktop app ships the output and
 * serves it from a loopback server, so the packaged app and the website are the
 * same pages built from the same components — there is no second implementation
 * of anything to drift.
 */
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// The desktop app ships this output and makes no network request unless you run
// the network test — a promise the privacy page makes on its behalf. An ad frame
// and an analytics tag are both network requests, so advertising and analytics
// are switched off here rather than left to whoever runs the build.
//
// Everything that could reach the config is imported after the assignments, and
// dynamically: a static import is evaluated before the first statement in this
// file, so the config would have read the variables as they were and the desktop
// build would have quietly shipped ads and phoned home on every page.
process.env.ADS_SLOT = '';
process.env.ANALYTICS_SRC = '';
const [{ TESTS }, { default: app }] = await Promise.all([
  import('@d3vices/tests/registry'),
  import('./app.js'),
]);

const outDir = process.argv[2] || join(import.meta.dir, '../../../dist/site');

const ROUTES = [
  '/',
  '/about',
  '/privacy',
  '/pricing',
  '/changelog',
  '/download',
  '/machine',
  ...TESTS.map((t) => `/${t.slug}`),
];

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

// The icon set is served from the root on the site, so the export has to place
// it there too — otherwise every <link rel="icon"> in the exported HTML 404s.
await cp(join(import.meta.dir, '../public/icons'), join(outDir, 'icons'), { recursive: true });
await cp(join(import.meta.dir, '../public/icons/favicon.ico'), join(outDir, 'favicon.ico'));
await cp(join(import.meta.dir, '../public/icons/browserconfig.xml'), join(outDir, 'browserconfig.xml'));

// The manifest is a route rather than a file, so render it into the export.
const manifest = await app.fetch(new Request('http://localhost/manifest.webmanifest'));
await writeFile(join(outDir, 'manifest.webmanifest'), await manifest.text());

console.log(`[export] ${ROUTES.length + 1} pages + static assets -> ${outDir}`);

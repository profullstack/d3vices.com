/**
 * Bundles the client into one file. Run by `bun run build:client`, by the
 * Dockerfile's build stage, and by the desktop packaging step — the desktop app
 * serves the same bundle from disk, so there is exactly one implementation of
 * every test.
 */
import { rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outdir = join(here, '../../apps/web/public/static/js');

await rm(join(outdir, 'app.js'), { force: true });

const result = await Bun.build({
  entrypoints: [join(here, 'src/index.js')],
  outdir,
  naming: 'app.js',
  target: 'browser',
  format: 'esm',
  minify: process.env.NODE_ENV !== 'development',
  sourcemap: process.env.NODE_ENV === 'development' ? 'linked' : 'none',
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

const bytes = result.outputs.reduce((sum, o) => sum + o.size, 0);
console.log(`[build] client bundle ${(bytes / 1024).toFixed(1)} KB -> ${outdir}/app.js`);

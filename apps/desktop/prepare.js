/**
 * Stages everything the packaged desktop app needs:
 *   - the exported static site (same pages the website serves)
 *   - the shared test registry, so the app menu cannot drift from the site
 *   - the icon electron-builder turns into platform icons
 * Run by `bun run desktop` and by the release workflow before electron-builder.
 */
import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const here = import.meta.dir;
const repo = join(here, '../..');

await rm(join(here, 'site'), { recursive: true, force: true });
await cp(join(repo, 'dist/site'), join(here, 'site'), { recursive: true });

await cp(join(repo, 'packages/tests/src/registry.js'), join(here, 'src/registry.mjs'));

await mkdir(join(here, 'build'), { recursive: true });
await cp(join(repo, 'apps/web/public/icons/icon-512x512.png'), join(here, 'build/icon.png'));

console.log('[desktop] staged site, registry and icon');

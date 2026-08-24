import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TESTS } from '../packages/tests/src/registry.js';

const sw = readFileSync(join(import.meta.dir, '../apps/web/public/sw.js'), 'utf8');

describe('service worker', () => {
  test('precaches every test page, or that test breaks offline', () => {
    // The whole promise of this site is that it works when the network is the
    // broken thing. A test added to the registry and not to the precache list
    // silently fails that promise, and only offline.
    for (const t of TESTS) expect(sw).toContain(`'/${t.slug}'`);
  });

  test('precaches the shell assets', () => {
    for (const asset of ['/', '/static/css/style.css', '/static/js/app.js', '/manifest.webmanifest']) {
      expect(sw).toContain(`'${asset}'`);
    }
  });

  test('never caches the network test endpoints', () => {
    // A cached speed test measures the disk and reports an infinitely fast link.
    expect(sw).toContain("url.pathname.startsWith('/api/')");
  });

  test('uses allSettled so one failed asset cannot void the whole cache', () => {
    expect(sw).toContain('allSettled');
  });
});

describe('client bundle', () => {
  const bundle = readFileSync(join(import.meta.dir, '../apps/web/public/static/js/app.js'), 'utf8');

  test('exists and is not empty', () => {
    expect(bundle.length).toBeGreaterThan(10000);
  });

  test('contains a mount path for every registered test id', () => {
    for (const t of TESTS) expect(bundle).toContain(t.id);
  });
});

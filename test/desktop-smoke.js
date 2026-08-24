/**
 * Starts the packaged Electron app under a virtual display and fails unless the
 * window actually renders the site. Catches the failures that only exist in the
 * desktop build: a broken loopback server, a preload that throws, a missing
 * staged asset.
 */
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const electron = join(root, 'node_modules/electron/dist/electron');

if (!(await Bun.file(electron).exists())) {
  console.error('Electron is not installed. Run `bun install` without --ignore-scripts.');
  process.exit(1);
}

const child = spawn(electron, ['--no-sandbox', join(root, 'apps/desktop')], {
  env: { ...process.env, D3VICES_SMOKE: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let out = '';
child.stdout.on('data', (d) => {
  out += d;
  process.stdout.write(d);
});
child.stderr.on('data', (d) => {
  out += d;
  process.stderr.write(d);
});

const result = await Promise.race([
  new Promise((resolve) => child.on('close', (code) => resolve({ exited: true, code }))),
  new Promise((resolve) => setTimeout(() => resolve({ exited: false }), 40000)),
]);

if (!result.exited) {
  child.kill('SIGTERM');
  console.error('\nFAIL: the app never reported a rendered window within 40s.');
  process.exit(1);
}

if (result.code !== 0) {
  console.error(`\nFAIL: the app exited with code ${result.code}.`);
  process.exit(1);
}

if (!out.includes('[smoke] ok')) {
  console.error('\nFAIL: the app exited without confirming the page rendered.');
  process.exit(1);
}

console.log('\nDesktop smoke test passed.');

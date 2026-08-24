/**
 * Loads every test page in a real Chromium and fails if any of them logs an
 * error or leaves its "Loading the test…" placeholder behind. Unit tests cannot
 * catch a module that throws on mount, because mounting needs a DOM and a
 * browser's device APIs.
 */
import { spawn } from 'node:child_process';
import app from '../apps/web/src/app.js';
import { TESTS } from '../packages/tests/src/registry.js';

const server = Bun.serve({ port: 0, fetch: app.fetch, maxRequestBodySize: 128 * 1024 * 1024 });
const base = `http://127.0.0.1:${server.port}`;

async function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  for (const path of ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium']) {
    if (await Bun.file(path).exists()) return path;
  }
  // A locally cached Puppeteer download, which is what a dev box usually has.
  try {
    const glob = new Bun.Glob('chrome/linux-*/chrome-linux64/chrome');
    for await (const found of glob.scan({ cwd: `${process.env.HOME}/.cache/puppeteer`, absolute: true })) {
      return found;
    }
  } catch {
    // no cache directory
  }
  return null;
}

const chrome = await findChrome();
if (!chrome) {
  console.error('No Chrome binary found. Set CHROME_PATH.');
  server.stop();
  process.exit(1);
}

function run(url) {
  return new Promise((resolve) => {
    const child = spawn(chrome, [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--enable-logging=stderr',
      '--v=0',
      '--virtual-time-budget=3000',
      '--dump-dom',
      url,
    ]);
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => {
      out += d;
    });
    child.stderr.on('data', (d) => {
      err += d;
    });
    child.on('close', () => resolve({ out, err }));
  });
}

let failed = 0;
for (const test of TESTS) {
  const { out, err } = await run(`${base}/${test.slug}`);
  const consoleErrors = err
    .split('\n')
    .filter((l) => /ERROR:CONSOLE|Uncaught/i.test(l) && !/favicon/i.test(l));
  const stuck = out.includes('Loading the test');

  if (consoleErrors.length) {
    console.error(`FAIL ${test.slug}: ${consoleErrors[0].slice(0, 160)}`);
    failed += 1;
  } else if (stuck) {
    console.error(`FAIL ${test.slug}: the module never replaced its placeholder`);
    failed += 1;
  } else {
    console.log(`ok   ${test.slug}`);
  }
}

server.stop();
console.log(
  failed
    ? `\n${failed} of ${TESTS.length} test pages failed.`
    : `\nAll ${TESTS.length} test pages mounted cleanly.`,
);
process.exit(failed ? 1 : 0);

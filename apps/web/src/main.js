import { config, siteName } from '@d3vices/config';
import { TESTS } from '@d3vices/tests/registry';
import app from './app.js';

console.log(`[web] ${siteName} listening on :${config.port} — ${config.siteUrl} (${TESTS.length} tests)`);

export default {
  port: config.port,
  fetch: app.fetch,
  // The network test's largest upload step is 16MB; the ceiling is raised well
  // clear of it so a big transfer cannot fail in a way that looks like a
  // network fault.
  maxRequestBodySize: 128 * 1024 * 1024,
};

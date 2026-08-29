/** One place that reads the environment, so nothing else has to guess. */
const env = (key, fallback) => process.env[key] ?? fallback;

export const config = {
  port: Number(env('PORT', 8080)),
  // Every generated URL is built from this: canonicals, og:image, the sitemap,
  // manifest ids and share links. Getting it wrong is invisible until a link is
  // clicked from somewhere else.
  siteUrl: env('SITE_URL', `http://localhost:${env('PORT', 8080)}`).replace(/\/$/, ''),
  databaseUrl: env('DATABASE_URL', ''),
  isProduction: env('NODE_ENV') === 'production',
  analytics: {
    src: env('ANALYTICS_SRC', ''),
    siteId: env('ANALYTICS_SITE_ID', ''),
  },
};

export const siteName = 'd3vices';
export const siteTagline = 'Open-source hardware diagnostics that run on your device.';

/**
 * When this build went out. Captured once at start-up rather than written down,
 * so it is the deploy date and cannot go stale between releases. Pages carry it
 * as a freshness signal; nothing decides behaviour from it.
 */
export const buildDate = new Date().toISOString();

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
  /**
   * The CrawlProof slot this site sells its ad inventory through. It is a
   * public identifier, not a secret — it ships in the markup — so it is written
   * down here rather than left to a variable somebody has to remember to set,
   * which would make merging this a silent no-op.
   *
   * Set `ADS_SLOT=` (empty) to turn advertising off. The static export does
   * exactly that, because the desktop app must make no network request.
   */
  ads: {
    origin: 'https://crawlproof.com',
    slot: env('ADS_SLOT', 'f54a21ad-3db6-4a62-a9f4-93d505c221c9'),
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

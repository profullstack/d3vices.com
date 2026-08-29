import { config } from '@d3vices/config';

/**
 * One CrawlProof ad unit, embedded as a script-free cross-origin iframe.
 *
 * The generated install snippet loads `crawlproof.com/ad.js`, which fills each
 * placeholder with a `srcdoc` iframe. A srcdoc document inherits the embedding
 * page's Content-Security-Policy, so the creative's own `<style>` block and its
 * remote images would render only if this site added `'unsafe-inline'` to
 * `style-src` and opened `img-src` to the web — on every page, for an ad. The
 * policy in app.js is a large part of what this site is; it is not worth that.
 *
 * `/api/ads/frame` returns the same creative as a real cross-origin document,
 * which carries its own policy. This end needs one `frame-src` entry, runs no
 * third-party JavaScript, sets no cookie, and — unlike the script tag, which
 * mints a `crawlproof.visitor` id — writes nothing into this origin's local
 * storage. The privacy page can go on saying what it says.
 *
 * The cost of having no script is that nothing here can measure anything, and
 * that shapes both remaining choices.
 *
 * The format is one fixed size for every viewport, because picking by width
 * would need a script and rendering two units would bill two impressions for
 * one reader. It is the rectangle: 300px is the widest fixed creative that
 * still fits a 320px phone, and every creative is laid out at its format's
 * exact pixel width inside the frame, so a narrower column crops it instead of
 * reflowing it. The stylesheet handles the columns that are narrower than that
 * by letting the unit escape their padding — see `.ad-unit` there.
 *
 * The theme is not passed at all. `/api/ads/frame` defaults to shipping both
 * palettes behind a `prefers-color-scheme` query, which the frame answers from
 * the reader's own browser — a better signal than anything this end could
 * guess, given the site's theme is itself a stored preference the server never
 * sees.
 */
const SIZES = {
  banner_300x250: [300, 250],
  banner_728x90: [728, 90],
  banner_320x50: [320, 50],
  // Fluid: the creative fills whatever width the frame is given.
  text_link: [null, 40],
};

export function AdUnit({ format = 'banner_300x250' }) {
  const { origin, slot } = config.ads;
  // No slot configured — the desktop export, and any checkout that has not set
  // one — renders nothing at all rather than an empty box.
  if (!slot) return null;
  const size = SIZES[format];
  if (!size) return null;
  const [width, height] = size;
  const src = `${origin}/api/ads/frame?slot=${encodeURIComponent(slot)}&format=${encodeURIComponent(format)}`;

  return (
    <aside class="ad-unit" data-ad-format={format}>
      {/* The text link carries its own "Sponsored" mark inside the frame. The
          banner creatives do not, so those get a label out here. */}
      {format === 'text_link' ? null : <span class="ad-label">Advertisement</span>}
      {/* No allow-scripts and no allow-same-origin: the creative is static
          HTML. The popup permissions are what let its click-through open a new
          tab, which is the only thing it is allowed to do. */}
      <iframe
        src={src}
        title="Advertisement"
        width={width ?? undefined}
        height={height}
        loading="lazy"
        scrolling="no"
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      />
    </aside>
  );
}

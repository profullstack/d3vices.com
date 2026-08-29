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
 * The format is the sponsored line. Every banner creative is laid out at its
 * format's exact pixel width inside the frame, so a column narrower than that
 * crops it rather than reflowing it, and the rectangle that stood here before
 * read as a box dropped into the middle of a page that is otherwise hairlines
 * and mono. `text_link` is the one format built to fill its container: 40px
 * tall at any width, dropping its second line under 520px, asking nothing of
 * the column it lands in. It is also the smallest thing the slot can sell, and
 * that trade is the point rather than an oversight. A wider banner is not
 * available without giving up something else here — picking a size by width
 * would need a script, and rendering two units for CSS to hide one would bill
 * two impressions for a single reader.
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

export function AdUnit({ format = 'text_link' }) {
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

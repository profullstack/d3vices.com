import { config } from '@d3vices/config';
import { Layout } from '../components/Layout.jsx';
import { breadcrumb } from '../schema.js';

export function Privacy() {
  return (
    <Layout
      title="Privacy"
      description="What d3vices collects: nothing from your devices. A plain-language privacy policy for an open-source hardware test suite."
      path="/privacy"
      jsonLd={{ '@context': 'https://schema.org', '@graph': [breadcrumb('Privacy', '/privacy')] }}
    >
      <section class="prose">
        <h1>Privacy</h1>
        <p class="lede">
          No account. No tracking cookies. Nothing captured from your camera, microphone, screen, location or
          sensors ever leaves your device.
        </p>

        <h2>What the tests do with your data</h2>
        <p>
          Every test runs in your browser. Camera and screen frames are rendered in your own tab and discarded
          when you stop. Microphone audio is fed to a Web Audio analyser to draw a waveform; a recording you
          make is held in memory and dropped when you leave the page. Location, motion and Bluetooth readings
          are displayed and never transmitted. There is no server-side code that receives any of it, which you
          can verify in the repository.
        </p>

        <h2>What is stored on your device</h2>
        <p>
          Local storage holds your colour theme, your keyboard layout choice, and your own scores for the
          click, scroll and reaction tests. You can clear it from within each test or by clearing site data.
          It is never sent anywhere.
        </p>

        <h2>What the server sees</h2>
        <p>
          Ordinary web server request logs: the page requested, a timestamp, and the request headers your
          browser sends. The network test additionally transfers a block of random bytes in each direction so
          it has something to measure; the contents are generated on the spot and discarded.
        </p>

        <h2>Third parties</h2>
        <p>
          The two typefaces are loaded from Google Fonts, so fetching them tells Google that a browser at your
          address asked for a font file. Nothing else about you goes with it.
        </p>
        {config.analytics.src ? (
          <p>
            A privacy-preserving, cookie-free analytics endpoint records page views in aggregate. It sets no
            cookie and does not fingerprint you.
          </p>
        ) : null}
        {config.ads.slot ? (
          <p>
            There is one advertisement on some pages, sold through CrawlProof, and it is what pays for the
            site. It is embedded the quiet way: a plain frame containing a page from their server, rather than
            the usual advertising script. No third-party code runs on this page, no cookie is set, and nothing
            is written to the local storage described above — an ad script would have put a permanent visitor
            id there, and that is precisely why there is no ad script. Loading the frame tells CrawlProof what
            any request tells a server: your IP address, your browser’s user agent, and which page the ad
            appeared on. Which ad you get is chosen from that and nothing else. No reading any test takes is
            available to it, or to anyone.
          </p>
        ) : null}
        {!config.analytics.src && !config.ads.slot ? (
          <p>Nothing further. No analytics and no advertising.</p>
        ) : null}

        <h2>The desktop app</h2>
        <p>
          The desktop build makes no network request at all unless you run the network test. It does not check
          for updates in the background and it has no telemetry.
        </p>

        <h2>Contact</h2>
        <p>
          Questions, or something here that does not match what the code does? Open an issue at{' '}
          <a href="https://github.com/profullstack/d3vices.com/issues" rel="noopener noreferrer">
            github.com/profullstack/d3vices.com
          </a>
          .
        </p>
      </section>
    </Layout>
  );
}

import { config } from '@d3vices/config';
import { Layout } from '../components/Layout.jsx';

export function Privacy() {
  return (
    <Layout
      title="Privacy"
      description="What d3vices collects: nothing from your devices. A plain-language privacy policy for an open-source hardware test suite."
      path="/privacy"
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
          {config.analytics.src
            ? 'A privacy-preserving, cookie-free analytics endpoint records page views in aggregate. It sets no cookie and does not fingerprint you.'
            : 'None. No analytics, no advertising, no fonts or scripts loaded from anyone else’s server.'}
        </p>

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

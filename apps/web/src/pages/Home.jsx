import { config } from '@d3vices/config';
import { GROUPS, TESTS, testsInGroup } from '@d3vices/tests/registry';
import { Layout } from '../components/Layout.jsx';

export function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${config.siteUrl}/#organization`,
        name: 'Profullstack, Inc.',
        url: config.siteUrl,
      },
      {
        '@type': 'WebSite',
        '@id': `${config.siteUrl}/#website`,
        name: 'd3vices',
        url: config.siteUrl,
        publisher: { '@id': `${config.siteUrl}/#organization` },
      },
      {
        '@type': ['WebApplication', 'SoftwareApplication'],
        '@id': `${config.siteUrl}/#software`,
        name: 'd3vices',
        url: config.siteUrl,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Windows, macOS, Linux, Android, iOS',
        isAccessibleForFree: true,
        license: 'https://opensource.org/licenses/MIT',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    ],
  };

  return (
    <Layout
      title="d3vices — test your microphone, camera, screen, keyboard and sensors"
      description="Free open-source hardware diagnostics. Test your mic, camera, speakers, screen sharing, display, keyboard, mouse, gamepad, sensors and network — in the browser, installed as an app, or on the desktop. Nothing is uploaded."
      path="/"
      jsonLd={jsonLd}
    >
      <section class="hero">
        <p class="eyebrow">Open source · MIT · nothing leaves your device</p>
        <h1>
          Check the device
          <br />
          in front of you.
        </h1>
        <p class="hero-sub">
          {TESTS.length} hardware tests that run entirely in your browser. No account, no upload, no trial.
          Install it as an app, or run the desktop build on Windows, macOS and Linux.
        </p>
        <div class="hero-actions">
          <a class="btn btn-primary btn-lg" href="/microphone">
            Test my microphone
          </a>
          <a class="btn btn-secondary btn-lg" href="#tests">
            Browse all tests
          </a>
        </div>
        <dl class="hero-stats">
          <div>
            <dt>Tests</dt>
            <dd>{TESTS.length}</dd>
          </div>
          <div>
            <dt>Accounts required</dt>
            <dd>0</dd>
          </div>
          <div>
            <dt>Data uploaded</dt>
            <dd>None</dd>
          </div>
          <div>
            <dt>Works offline</dt>
            <dd>Yes</dd>
          </div>
        </dl>
      </section>

      <section class="section" id="tests">
        <h2>Every test</h2>
        {GROUPS.map((group) => (
          <div class="group">
            <h3 class="group-title">{group.name}</h3>
            <div class="card-grid">
              {testsInGroup(group.id).map((test) => (
                <a class="card" href={`/${test.slug}`}>
                  <h4>{test.name}</h4>
                  <p>{test.blurb}</p>
                  <span class="card-apis">{test.apis.join(' · ')}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section class="section section-split">
        <div>
          <h2>Why another device tester?</h2>
          <p>
            Because the ones that exist are closed boxes that ask you to grant camera and microphone access on
            trust. This one is MIT licensed: the code that touches your devices is the code in the repository,
            and you can read it before you press start.
          </p>
          <p>
            It is also a real progressive web app. Install it once and every test keeps working with the
            network unplugged — which matters, because a broken network is one of the things you came here to
            diagnose.
          </p>
        </div>
        <div>
          <h2>Three ways to run it</h2>
          <ul class="tick-list">
            <li>
              <strong>In the browser.</strong> Nothing to install. Every test that the browser exposes an API
              for.
            </li>
            <li>
              <strong>Installed as an app.</strong> Add to your home screen or desktop, then run it offline.
            </li>
            <li>
              <strong>On the desktop.</strong> Windows, macOS and Linux builds that also read the things a
              browser is not allowed to see. <a href="/download">Get the desktop app</a>.
            </li>
          </ul>
        </div>
      </section>
    </Layout>
  );
}

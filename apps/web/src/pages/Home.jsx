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
        <div class="hero-copy">
          <p class="eyebrow">{TESTS.length} instruments · MIT · offline</p>
          <h1>
            Find the fault
            <br />
            before the call does.
          </h1>
          <p class="hero-sub">
            {TESTS.length} hardware instruments that run inside the page — microphone, camera, screen share,
            keyboard, sensors, network. Nothing is uploaded, nothing is kept, and the source is on the bench
            for you to read.
          </p>
          <div class="hero-actions">
            <a class="btn btn-primary btn-lg" href="/microphone">
              Run the mic test
            </a>
            <a class="btn btn-secondary btn-lg" href="#tests">
              All {TESTS.length} instruments
            </a>
          </div>
        </div>

        {/* The hero image is a reading, not an illustration. */}
        <div class="scope" aria-hidden="true">
          <div class="scope-head">
            <span>INPUT — MICROPHONE</span>
            <span class="scope-live">LIVE</span>
          </div>
          <div class="scope-screen">
            <svg viewBox="0 0 560 236" preserveAspectRatio="none" role="presentation">
              <path
                d="M0 118 L28 118 L40 74 L52 162 L64 96 L76 140 L88 60 L100 176 L112 108 L124 128 L140 118 L164 118 L176 88 L188 150 L200 70 L212 166 L224 104 L236 132 L252 118 L280 118 L292 82 L304 158 L316 66 L328 172 L340 100 L352 136 L368 118 L396 118 L408 92 L420 146 L432 78 L444 160 L456 112 L468 124 L484 118 L560 118"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div class="scope-foot">
            <div>
              <div class="stat-label">Peak</div>
              <div class="stat-value">−6.2 dBFS</div>
            </div>
            <div>
              <div class="stat-label">Rate</div>
              <div class="stat-value">48 000 Hz</div>
            </div>
            <div>
              <div class="stat-label">Channels</div>
              <div class="stat-value">1 mono</div>
            </div>
          </div>
        </div>
      </section>

      <dl class="hero-stats">
        <div>
          <dt>Instruments</dt>
          <dd>{TESTS.length}</dd>
        </div>
        <div>
          <dt>Bytes uploaded</dt>
          <dd>0</dd>
        </div>
        <div>
          <dt>Accounts</dt>
          <dd>None</dd>
        </div>
        <div>
          <dt>Works offline</dt>
          <dd>Yes</dd>
        </div>
      </dl>

      <section class="section" id="tests">
        <div class="section-head">
          <h2>The rack</h2>
          <span class="section-count">
            {TESTS.length} / {TESTS.length} AVAILABLE
          </span>
        </div>
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

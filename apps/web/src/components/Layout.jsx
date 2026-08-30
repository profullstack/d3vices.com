import { buildDate, config, siteName } from '@d3vices/config';
import { GROUPS, TESTS, testsInGroup } from '@d3vices/tests/registry';
import { THEME_SCRIPT } from '../inline-scripts.js';
import { RackNav } from './RackNav.jsx';

const ASSET_VERSION = process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 8) || String(Date.now());

export function Layout({
  title,
  description,
  path = '/',
  jsonLd,
  wide = false,
  noindex = false,
  current,
  children,
}) {
  const canonical = `${config.siteUrl}${path === '/' ? '' : path}`;
  const fullTitle = path === '/' ? title : `${title} · ${siteName}`;

  return (
    <html lang="en" data-theme-default="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        {/* Named publisher and a build date: both are E-E-A-T signals, and the
            date is the deploy rather than a constant that would go stale. */}
        <meta name="author" content="Profullstack, Inc." />
        <meta property="article:modified_time" content={buildDate} />
        {/* The 404 page is reachable at every wrong URL, so a canonical would
            point every one of them at an address that 404s in turn. */}
        {noindex ? (
          <meta name="robots" content="noindex, follow" />
        ) : (
          <link rel="canonical" href={canonical} />
        )}

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={`${config.siteUrl}/static/img/og.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${config.siteUrl}/static/img/og.png`} />

        <link rel="manifest" href="/manifest.webmanifest" />

        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" sizes="16x16 32x32" />

        {/* iOS picks the closest size rather than scaling one, so it gets them all. */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/apple-touch-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/apple-touch-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-touch-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/apple-touch-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icons/apple-touch-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/icons/apple-touch-icon-57x57.png" />

        <meta name="theme-color" content="#08090c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={siteName} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0b0f14" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
        <link rel="stylesheet" href={`/static/css/style.css?v=${ASSET_VERSION}`} />
        {/* Set the theme before first paint so a stored light theme never flashes dark.
            The CSP names this script by hash, so it has to be the shared constant. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {jsonLd ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        ) : null}
        {/* `data-site` is the attribute the tracker actually reads. It looks up
            `script.dataset.site` and returns silently when it is missing, so the
            earlier `data-website-id` would have loaded the script, cost the
            request, and reported nothing — the same empty dashboard as having no
            tag at all. */}
        {config.analytics.src ? (
          <script defer src={config.analytics.src} data-site={config.analytics.siteId} />
        ) : null}
      </head>
      <body>
        <a class="skip-link" href="#main">
          Skip to content
        </a>
        {/* Deliberately empty: the sentence is written by the script that
            unhides this, so it is not the first text a crawler reads on all
            29 pages when no reader is ever shown it there. */}
        <div class="offline-banner" data-offline hidden />
        <Header />
        {/* The desktop build shares this markup; CSS decides what belongs to an
            app and what belongs to a website, so there is one set of components. */}
        <div class="app-body">
          <RackNav current={current} class="rack-nav app-rack" />
          <main id="main" class={wide ? 'main main-wide' : 'main'}>
            {children}
          </main>
        </div>
        <Footer />
        {/* Filled from the native bridge; stays hidden in a browser tab. */}
        <div class="status-bar" data-status-bar hidden>
          <span data-status-system>—</span>
          <span data-status-cpu></span>
          <span data-status-memory></span>
          <span data-status-displays></span>
          <span class="status-bar-note">NOTHING LEAVES THIS MACHINE</span>
        </div>
        <script type="module" src={`/static/js/app.js?v=${ASSET_VERSION}`} />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header class="header">
      <div class="header-inner">
        <a class="brand" href="/">
          <span class="brand-mark" aria-hidden="true">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12h4l2.5-6 4 12 3-8 2 2H22" />
            </svg>
          </span>
          <span class="brand-name">d3vices</span>
        </a>
        <button
          class="nav-toggle"
          type="button"
          data-nav-toggle
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>
        <nav class="nav" data-nav aria-label="Tests">
          {GROUPS.map((group) => (
            <div class="nav-group nav-web-only">
              <button class="nav-group-label" type="button">
                {group.name}
              </button>
              <div class="nav-menu">
                {testsInGroup(group.id).map((test) => (
                  <a class="nav-link" href={`/${test.slug}`}>
                    {test.short}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <a class="nav-link nav-link-plain nav-web-only" href="/download">
            Desktop app
          </a>
          <a class="nav-link nav-desktop-only" href="/">
            Instruments
          </a>
          <a class="nav-link nav-desktop-only" href="/machine">
            This machine
          </a>
          <button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle colour theme">
            <span class="theme-toggle-icon" />
          </button>
          <button class="btn btn-primary btn-install nav-web-only" type="button" data-install hidden>
            Install
          </button>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="brand-mark" aria-hidden="true">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12h4l2.5-6 4 12 3-8 2 2H22" />
            </svg>
          </span>
          <p>
            Every test runs on your device. Nothing you test is uploaded, and there is no account to make.
          </p>
          <p class="footer-oss">
            MIT licensed ·{' '}
            <a href="https://github.com/profullstack/d3vices.com" rel="noopener noreferrer">
              Source on GitHub
            </a>
          </p>
        </div>
        {GROUPS.map((group) => (
          <div class="footer-col">
            <h3>{group.name}</h3>
            {testsInGroup(group.id).map((test) => (
              <a href={`/${test.slug}`}>{test.short}</a>
            ))}
          </div>
        ))}
        <div class="footer-col">
          <h3>Project</h3>
          <a href="/download">Desktop app</a>
          <a href="/about">About</a>
          <a href="/pricing">Pricing</a>
          <a href="/changelog">Changelog</a>
          <a href="/privacy">Privacy</a>
          <a href="mailto:hello@profullstack.com">Contact</a>
          <a href="https://github.com/profullstack/d3vices.com" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© {new Date().getFullYear()} Profullstack, Inc.</span>
        <span>{TESTS.length} INSTRUMENTS · NO SIGN-UP · NO TRACKING</span>
      </div>
    </footer>
  );
}

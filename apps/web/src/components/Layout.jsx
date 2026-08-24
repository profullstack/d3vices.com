import { config, siteName } from '@d3vices/config';
import { GROUPS, TESTS, testsInGroup } from '@d3vices/tests/registry';

const ASSET_VERSION = process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 8) || String(Date.now());

export function Layout({ title, description, path = '/', jsonLd, wide = false, children }) {
  const canonical = `${config.siteUrl}${path === '/' ? '' : path}`;
  const fullTitle = path === '/' ? title : `${title} · ${siteName}`;

  return (
    <html lang="en" data-theme-default="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />

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
        <link rel="icon" href="/static/img/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/static/img/icon-192.png" />
        <meta name="theme-color" content="#08090c" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
        <link rel="stylesheet" href={`/static/css/style.css?v=${ASSET_VERSION}`} />
        {/* Set the theme before first paint so a stored light theme never flashes dark. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('d3vices:theme');if(t)document.documentElement.dataset.theme=t;}catch(e){}",
          }}
        />
        {jsonLd ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        ) : null}
        {config.analytics.src ? (
          <script defer src={config.analytics.src} data-website-id={config.analytics.siteId} />
        ) : null}
      </head>
      <body>
        <a class="skip-link" href="#main">
          Skip to content
        </a>
        <div class="offline-banner" data-offline hidden>
          You are offline. Every test still works — they all run on your device.
        </div>
        <Header />
        <main id="main" class={wide ? 'main main-wide' : 'main'}>
          {children}
        </main>
        <Footer />
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
            <div class="nav-group">
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
          <a class="nav-link nav-link-plain" href="/download">
            Desktop app
          </a>
          <button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle colour theme">
            <span class="theme-toggle-icon" />
          </button>
          <button class="btn btn-primary btn-install" type="button" data-install hidden>
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
          <a href="/privacy">Privacy</a>
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

import { config } from '@d3vices/config';
import { GROUPS, TESTS, testsInGroup } from '@d3vices/tests/registry';
import { Layout } from '../components/Layout.jsx';

/**
 * Rack codes (A-01, C-04) are derived from the group order and the test's
 * position inside it, so adding a test never means hand-maintaining a label.
 */
const GROUP_LETTER = Object.fromEntries(GROUPS.map((group, i) => [group.id, String.fromCharCode(65 + i)]));

export function rackCode(test) {
  const index = testsInGroup(test.group).findIndex((t) => t.id === test.id);
  return `${GROUP_LETTER[test.group] ?? '?'}-${String(index + 1).padStart(2, '0')}`;
}

function RackNav({ current }) {
  return (
    <nav class="rack-nav" aria-label="All tests">
      {GROUPS.map((group) => (
        <div>
          <div class="rack-group">
            {GROUP_LETTER[group.id]} — {group.name.toUpperCase()}
          </div>
          {testsInGroup(group.id).map((test) => (
            <a
              class={test.id === current ? 'rack-link is-current' : 'rack-link'}
              href={`/${test.slug}`}
              aria-current={test.id === current ? 'page' : undefined}
            >
              {test.short}
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
}

export function TestPage({ test }) {
  const path = `/${test.slug}`;
  const related = testsInGroup(test.group)
    .filter((t) => t.id !== test.id)
    .slice(0, 4);
  const others = TESTS.filter((t) => t.group !== test.group).slice(0, 4);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: test.name,
        url: `${config.siteUrl}${path}`,
        description: test.description,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any browser',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'd3vices', item: config.siteUrl },
          { '@type': 'ListItem', position: 2, name: test.name, item: `${config.siteUrl}${path}` },
        ],
      },
    ],
  };

  return (
    <Layout title={test.name} description={test.description} path={path} jsonLd={jsonLd} wide>
      <div class="test-layout">
        <RackNav current={test.id} />

        <article class="test-page">
          <header class="test-header">
            <p class="test-code">
              <b>{rackCode(test)}</b>
              <span>{test.apis.join(' · ')}</span>
            </p>
            <h1>{test.name}</h1>
            <p class="test-blurb">{test.description}</p>
          </header>

          {/* The client finds this and mounts the matching module into it. */}
          <div class="test-host" data-test={test.id}>
            <noscript>
              <p class="note note-warn">
                This test needs JavaScript — it talks to your hardware directly from the page. Nothing is sent
                anywhere.
              </p>
            </noscript>
            <p class="note">Loading the test…</p>
          </div>

          <section class="test-meta">
            <h2>Permissions</h2>
            {test.permissions.length ? (
              <p>
                {test.permissions.join(', ')} — requested only when you press start, and revocable at any time
                in your browser settings. Nothing captured is uploaded or stored.
              </p>
            ) : (
              <p>None. This test needs no browser permission at all.</p>
            )}
          </section>

          <section class="related">
            <h2>Nearby instruments</h2>
            <div class="card-grid">
              {[...related, ...others].slice(0, 6).map((t) => (
                <a class="card" href={`/${t.slug}`}>
                  <span class="card-apis">{rackCode(t)}</span>
                  <h4>{t.name}</h4>
                  <p>{t.blurb}</p>
                </a>
              ))}
            </div>
          </section>
        </article>
      </div>
    </Layout>
  );
}

import { config } from '@d3vices/config';
import { TESTS, testsInGroup } from '@d3vices/tests/registry';
import { Layout } from '../components/Layout.jsx';

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
      <article class="test-page">
        <header class="test-header">
          <p class="eyebrow">{test.apis.join(' · ')}</p>
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

        {test.permissions.length ? (
          <section class="test-meta">
            <h2>Permissions this test asks for</h2>
            <p>
              {test.permissions.join(', ')} — requested only when you press start, and revocable at any time
              in your browser settings. Nothing captured is uploaded or stored.
            </p>
          </section>
        ) : (
          <section class="test-meta">
            <h2>Permissions this test asks for</h2>
            <p>None. This test needs no browser permission at all.</p>
          </section>
        )}

        <section class="related">
          <h2>Related tests</h2>
          <div class="card-grid">
            {[...related, ...others].slice(0, 6).map((t) => (
              <a class="card" href={`/${t.slug}`}>
                <h4>{t.name}</h4>
                <p>{t.blurb}</p>
              </a>
            ))}
          </div>
        </section>
      </article>
    </Layout>
  );
}

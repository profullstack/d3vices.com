import { config } from '@d3vices/config';
import { API_DOCS } from '@d3vices/tests/api-docs';
import { TESTS, testsInGroup } from '@d3vices/tests/registry';
import { Layout } from '../components/Layout.jsx';
import { RackNav, rackCode } from '../components/RackNav.jsx';

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
      // Only where there are questions to describe. An empty FAQPage is worse
      // than none: it claims structure the page does not have.
      ...(test.faq.length
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${config.siteUrl}${path}#faq`,
              mainEntity: test.faq.map(({ q, a }) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <Layout
      title={test.name}
      description={test.description}
      path={path}
      jsonLd={jsonLd}
      wide
      current={test.id}
    >
      <div class="test-layout">
        <RackNav current={test.id} />

        <article class="test-page">
          <header class="test-header">
            <p class="test-code">
              <b>{rackCode(test)}</b>
              {/* Each API links to its MDN page. Naming an API is only useful
                  if you can go and read what it is and who implements it. */}
              <span>
                {test.apis.map((api, i) => (
                  <>
                    {i ? ' · ' : ''}
                    {API_DOCS[api] ? (
                      <a href={API_DOCS[api]} rel="noopener noreferrer">
                        {api}
                      </a>
                    ) : (
                      api
                    )}
                  </>
                ))}
              </span>
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

          {test.faq.length ? (
            <section class="test-faq" id="faq">
              <h2>Reading the result</h2>
              <dl class="faq-list">
                {test.faq.map(({ q, a }) => (
                  <div class="faq-item">
                    <dt>{q}</dt>
                    <dd>{a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section class="related">
            <h2>Nearby instruments</h2>
            <div class="card-grid">
              {[...related, ...others].slice(0, 6).map((t) => (
                <a class="card" href={`/${t.slug}`}>
                  <span class="card-apis">{rackCode(t)}</span>
                  {/* h3, not h4: these sit under the h2 above, and a skipped
                      level breaks the outline a screen reader navigates by. */}
                  <h3>{t.name}</h3>
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

import { config } from '@d3vices/config';
import { TESTS } from '@d3vices/tests/registry';
import { Layout } from '../components/Layout.jsx';
import { breadcrumb } from '../schema.js';

export function Pricing() {
  return (
    <Layout
      title="Pricing"
      description="d3vices is free. All 24 instruments, in the browser, as an installed app and on the desktop, MIT licensed with no paid tier, no trial and no account."
      path="/pricing"
      jsonLd={{
        '@context': 'https://schema.org',
        '@graph': [
          breadcrumb('Pricing', '/pricing'),
          // The same Offer the homepage declares. A price stated on a page
          // called Pricing is the one an answer engine will quote, so it must
          // not be able to disagree with the software node.
          {
            '@type': 'Offer',
            url: `${config.siteUrl}/pricing`,
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            itemOffered: { '@id': `${config.siteUrl}/#software` },
          },
        ],
      }}
    >
      <section class="prose">
        <h1>Pricing</h1>
        <p class="lede">
          It is free. All {TESTS.length} instruments, every way of running them, with no paid tier to upgrade
          to.
        </p>

        <h2>What free means here</h2>
        <p>
          Not free for now, and not free until you hit a limit. There is no trial, no card, no account, no
          seat count and no instrument held back for a plan that does not exist. The code is MIT licensed, so
          you can also run it yourself, change it, or ship it inside something else.
        </p>

        <div class="table-wrap">
          <table class="compare">
            <caption>What each way of running it costs</caption>
            <thead>
              <tr>
                <th scope="col">&nbsp;</th>
                <th scope="col">In the browser</th>
                <th scope="col">Installed as an app</th>
                <th scope="col">Desktop app</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Price</th>
                <td>Free, MIT</td>
                <td>Free, MIT</td>
                <td>Free, MIT</td>
              </tr>
              <tr>
                <th scope="row">Account</th>
                <td>None</td>
                <td>None</td>
                <td>None</td>
              </tr>
              <tr>
                <th scope="row">Instruments included</th>
                <td>All {TESTS.length}</td>
                <td>All {TESTS.length}</td>
                <td>All {TESTS.length}, plus a machine readout</td>
              </tr>
              <tr>
                <th scope="row">Advertising</th>
                <td>One frame on some pages</td>
                <td>One frame on some pages</td>
                <td>None</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Then who pays for it</h2>
        <p>
          One advertisement on some pages, sold through CrawlProof, covers what it costs to serve. It is a
          sandboxed frame rather than an advertising script, so no third-party code runs on the page, no
          cookie is set and no visitor id is written to your device. The desktop build carries no advertising
          at all, because it makes no network request. The <a href="/privacy">privacy page</a> describes
          exactly what the frame can and cannot see.
        </p>

        <h2>If you would rather pay nothing to anyone</h2>
        <p>
          Clone{' '}
          <a href="https://github.com/profullstack/d3vices.com" rel="noopener noreferrer">
            the repository
          </a>{' '}
          and run it. It is a single service with no database and no third-party dependency at runtime, and
          setting an empty advertising slot turns the frame off — which is exactly what the desktop build
          does.
        </p>
      </section>
    </Layout>
  );
}

import { CHANGELOG } from '../changelog.js';
import { Layout } from '../components/Layout.jsx';
import { breadcrumb } from '../schema.js';

export function Changelog() {
  return (
    <Layout
      title="Changelog"
      description="What changed in d3vices and when. Every release, newest first, written for the people who use it rather than the people who read the diff."
      path="/changelog"
      jsonLd={{ '@context': 'https://schema.org', '@graph': [breadcrumb('Changelog', '/changelog')] }}
    >
      <section class="prose">
        <h1>Changelog</h1>
        <p class="lede">
          Newest first. Dates are the day the change went out, and every entry is something a reader could
          notice — not every commit is here, because most commits are not news.
        </p>

        {CHANGELOG.map((entry) => (
          <section class="changelog-entry">
            {/* The date is the heading's own text, not a line above it: a
                screen reader jumping between headings should hear when as well
                as what, and an answer engine quoting one entry gets both. */}
            <h2>
              <time datetime={entry.date}>{entry.date}</time> — {entry.title}
            </h2>
            <ul>
              {entry.items.map((item) => (
                <li>{item}</li>
              ))}
            </ul>
          </section>
        ))}

        <h2>Following along</h2>
        <p>
          Every change lands in{' '}
          <a href="https://github.com/profullstack/d3vices.com" rel="noopener noreferrer">
            the repository
          </a>{' '}
          first, so the commit history is the long version of this page. Desktop builds are published as
          GitHub releases.
        </p>
      </section>
    </Layout>
  );
}

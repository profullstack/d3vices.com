import { TESTS } from '@d3vices/tests/registry';
import { Layout } from '../components/Layout.jsx';

export function NotFound() {
  return (
    <Layout title="Not found" description="That page does not exist." path="/404" noindex>
      <section class="prose">
        <h1>That page does not exist</h1>
        <p>It may have been renamed. Every test is listed below.</p>
        <h2>Every instrument</h2>
        <div class="card-grid">
          {TESTS.map((test) => (
            <a class="card" href={`/${test.slug}`}>
              <h3>{test.name}</h3>
            </a>
          ))}
        </div>
      </section>
    </Layout>
  );
}

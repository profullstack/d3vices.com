import { Layout } from '../components/Layout.jsx';
import { breadcrumb } from '../schema.js';

export function Machine() {
  return (
    <Layout
      title="This machine"
      description="Every display with its real scale factor and refresh rate, disks with free space, CPU and memory, and audio and video devices by name — the readings a browser is not allowed to take."
      path="/machine"
      jsonLd={{ '@context': 'https://schema.org', '@graph': [breadcrumb('This machine', '/machine')] }}
      wide
    >
      <article class="test-page">
        <header class="test-header">
          <p class="test-code">
            <b>NATIVE</b>
            <span>readings a browser cannot take</span>
          </p>
          <h1>This machine</h1>
          <p class="test-blurb">
            Every display with its real scale factor and refresh rate, disks with free space, the CPU model,
            and the audio and video devices attached to this machine. Nothing here is sent anywhere; the
            report reaches your clipboard only when you press the button.
          </p>
        </header>

        {/* The client fills this from the native bridge, or explains its absence. */}
        <div class="test-host" data-machine>
          <p class="note">Reading this machine…</p>
        </div>
      </article>
    </Layout>
  );
}

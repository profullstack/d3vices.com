import { Layout } from '../components/Layout.jsx';

export function Download({ release }) {
  return (
    <Layout
      title="Desktop app"
      description="Download d3vices for Windows, macOS and Linux. The same open-source hardware tests, plus the readings a browser is not allowed to take."
      path="/download"
    >
      <section class="hero hero-compact">
        <p class="eyebrow">Windows · macOS · Linux</p>
        <h1>d3vices on the desktop</h1>
        <p class="hero-sub">
          The same tests, packaged as a native app — plus the things a browser cannot see: real device
          enumeration, per-display details, disk and memory, and a system report you can hand to whoever is
          fixing the machine.
        </p>
      </section>

      <section class="section">
        <div class="card-grid">
          <div class="card card-static">
            <h4>Windows</h4>
            <p>Windows 10 and 11. Installer and portable build, x64 and arm64.</p>
            {release ? (
              <a class="btn btn-primary" href={`${release}`} rel="noopener noreferrer">
                Download for Windows
              </a>
            ) : (
              <span class="badge">Built on each tagged release</span>
            )}
          </div>
          <div class="card card-static">
            <h4>macOS</h4>
            <p>Apple silicon and Intel, as a signed disk image.</p>
            {release ? (
              <a class="btn btn-primary" href={`${release}`} rel="noopener noreferrer">
                Download for macOS
              </a>
            ) : (
              <span class="badge">Built on each tagged release</span>
            )}
          </div>
          <div class="card card-static">
            <h4>Linux</h4>
            <p>
              .deb and AppImage, x64 and arm64. Prefer the .deb on Ubuntu 24.04 and later — an AppImage cannot
              configure the Chromium sandbox from inside its own mount.
            </p>
            {release ? (
              <a class="btn btn-primary" href={`${release}`} rel="noopener noreferrer">
                Download for Linux
              </a>
            ) : (
              <span class="badge">Built on each tagged release</span>
            )}
          </div>
        </div>
        <p class="note">
          Every build is produced by GitHub Actions from the tagged commit, and the workflow that builds it is
          in the same public repository. Nothing here phones home: the desktop app makes no network request
          unless you run the network test.
        </p>
      </section>

      <section class="section section-split">
        <div>
          <h2>What the desktop build adds</h2>
          <ul class="tick-list">
            <li>Full audio and video device lists, with names, before any permission is granted.</li>
            <li>Every connected display, with its real resolution, scale factor and refresh rate.</li>
            <li>CPU model and core count, total and free memory, and per-disk free space.</li>
            <li>A copyable system report for a support ticket.</li>
          </ul>
        </div>
        <div>
          <h2>Or just install the web app</h2>
          <p>
            The site is a progressive web app. Install it from your browser and every test keeps working with
            the network unplugged — no download page needed, and it updates itself.
          </p>
          <button class="btn btn-secondary" type="button" data-install hidden>
            Install d3vices
          </button>
        </div>
      </section>
    </Layout>
  );
}

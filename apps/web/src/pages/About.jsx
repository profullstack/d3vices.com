import { TESTS } from '@d3vices/tests/registry';
import { Layout } from '../components/Layout.jsx';

export function About() {
  return (
    <Layout
      title="About"
      description="d3vices is an open-source, MIT-licensed set of browser hardware diagnostics from Profullstack. No accounts, no uploads, no tracking."
      path="/about"
    >
      <section class="prose">
        <h1>About d3vices</h1>
        <p>
          d3vices is {TESTS.length} hardware tests that run in your browser. It exists to answer one question
          before you join a call, ship a machine or open a support ticket: is the device in front of me
          actually working?
        </p>

        <h2>It is open source</h2>
        <p>
          The whole thing is MIT licensed and lives at{' '}
          <a href="https://github.com/profullstack/d3vices.com" rel="noopener noreferrer">
            github.com/profullstack/d3vices.com
          </a>
          . That matters more here than it does for most software: a device tester asks for your camera, your
          microphone and your location. You should be able to read what it does with them, and you can.
        </p>

        <h2>Nothing is uploaded</h2>
        <p>
          Every test runs in your browser and the data stays there. Camera frames are drawn to a canvas in
          your own tab. Microphone audio goes to an analyser node and is discarded. Scores are kept in local
          storage on your device. The only requests the site makes are for the page itself — and the network
          test, which exists precisely to move bytes.
        </p>

        <h2>It works offline</h2>
        <p>
          Install it and every test keeps running with the network unplugged. A diagnostic tool that needs a
          working connection to tell you your connection is broken is not much of a diagnostic tool.
        </p>

        <h2>When a test says it cannot run</h2>
        <p>
          Browsers differ, a lot. Firefox and Safari deliberately do not implement Web MIDI, Web Bluetooth or
          the Battery Status API. The ambient light sensor is behind a flag in Chromium. Where an API is
          missing, these tests say so plainly rather than reporting a hardware failure — the distinction is
          the entire point of the exercise.
        </p>

        <h2>Who builds it</h2>
        <p>
          <a href="https://profullstack.com" rel="noopener noreferrer">
            Profullstack, Inc.
          </a>{' '}
          Issues and pull requests are welcome on GitHub.
        </p>
      </section>
    </Layout>
  );
}

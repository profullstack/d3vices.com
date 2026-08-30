import { config, siteName, siteTagline } from '@d3vices/config';
import { API_DOCS } from '@d3vices/tests/api-docs';
import { GROUPS, TESTS, testsInGroup } from '@d3vices/tests/registry';

/**
 * The plain-text files that answer engines, LLMs and agents look for. Every one
 * of them is generated from the same registry the pages and the sitemap are
 * generated from, so a test added in one place cannot go missing here.
 */

const url = (path) => `${config.siteUrl}${path}`;
const REPO = 'https://github.com/profullstack/d3vices.com';

const SUMMARY =
  'Open-source hardware diagnostics that run inside the browser. Test a microphone, camera, ' +
  'speakers, screen share, display, keyboard, mouse, gamepad, sensors and network connection ' +
  'without installing anything, without an account, and without a byte of what you test leaving ' +
  'the device.';

const FACTS = [
  `${TESTS.length} tests, grouped into ${GROUPS.length} categories.`,
  'Free. MIT licensed. There is no paid tier, no sign-up and no tracking.',
  'Every test runs in the page. The only request that carries data is the network speed test, which exists to move bytes.',
  'Works offline once installed as a progressive web app, which matters because a broken network is one of the things it diagnoses.',
  'Also ships as a desktop app for Windows, macOS and Linux, which can read what a browser is not allowed to see.',
  'Where a browser does not implement an API, the test says so rather than reporting a hardware failure.',
];

/** https://llmstxt.org — a short, link-rich orientation file. */
export function llmsTxt() {
  const lines = [`# ${siteName}`, '', `> ${SUMMARY}`, ''];
  for (const fact of FACTS) lines.push(`- ${fact}`);
  lines.push('');

  for (const group of GROUPS) {
    lines.push(`## ${group.name}`, '');
    for (const test of testsInGroup(group.id)) {
      lines.push(`- [${test.name}](${url(`/${test.slug}`)}): ${test.blurb}`);
    }
    lines.push('');
  }

  lines.push(
    '## Project',
    '',
    `- [About](${url('/about')}): What it is, who builds it, and why it is open source.`,
    `- [Privacy](${url('/privacy')}): What is collected, which is nothing.`,
    `- [Desktop app](${url('/download')}): Windows, macOS and Linux builds.`,
    `- [This machine](${url('/machine')}): Hardware readout, in the desktop build.`,
    `- [Source on GitHub](${REPO}): MIT licensed. The code that touches your devices is the code in the repository.`,
    `- Contact: open an issue at ${REPO}/issues, or email hello@profullstack.com.`,
    `- [Full text for retrieval](${url('/llms-full.txt')}): Every page above, concatenated as Markdown.`,
    '',
  );
  return lines.join('\n');
}

/** The same ground, in full, for a model that would rather read once than crawl. */
export function llmsFullTxt() {
  const lines = [`# ${siteName} — full content`, '', `> ${SUMMARY}`, ''];
  for (const fact of FACTS) lines.push(`- ${fact}`);
  lines.push('', `Source: ${REPO} (MIT). Site: ${config.siteUrl}`, '');

  for (const group of GROUPS) {
    lines.push(`## ${group.name}`, '');
    for (const test of testsInGroup(group.id)) {
      lines.push(
        `### ${test.name}`,
        '',
        `URL: ${url(`/${test.slug}`)}`,
        '',
        test.description,
        '',
        `- Browser APIs: ${test.apis.map((a) => (API_DOCS[a] ? `[${a}](${API_DOCS[a]})` : a)).join(', ')}`,
        `- Permissions requested: ${test.permissions.length ? test.permissions.join(', ') : 'none'}`,
        `- Runs on: ${test.platforms.join(', ')}`,
        '',
      );
      for (const { q, a } of test.faq ?? []) lines.push(`**${q}**`, '', a, '');
    }
  }

  lines.push(
    '## Privacy',
    '',
    'Nothing you test is uploaded. Camera frames are drawn to a canvas in your own tab. Microphone audio',
    'goes to an analyser node and is discarded. Scores are kept in local storage on your device. There is no',
    'account, no cookie set by the site, and no third-party tracker.',
    '',
    '## Licence',
    '',
    `MIT. ${REPO}`,
    '',
  );
  return lines.join('\n');
}

/**
 * What an agent can actually do here. Deliberately short: this is a diagnostic
 * tool a person points at their own hardware, not a service with an API to
 * drive, and claiming otherwise would waste the reader's time.
 */
export function skillMd() {
  return [
    `# ${siteName}`,
    '',
    `${siteTagline} ${SUMMARY}`,
    '',
    '## What an agent can do',
    '',
    `- Read the catalogue of ${TESTS.length} tests at ${url('/llms.txt')}, or the full text at ${url('/llms-full.txt')}.`,
    '- Send a person straight to the test they need: every test is a plain URL, listed above.',
    '- Answer "how do I test my mic / camera / speakers" by linking the matching page. No sign-up stands in the way.',
    `- Point a person at a human: hello@profullstack.com, or an issue at ${REPO}/issues.`,
    '',
    '## What an agent cannot do',
    '',
    '- Run a test remotely. Every instrument reads hardware through a browser API that requires a real',
    '  device and, for camera, microphone, screen share and location, a permission the person grants',
    '  in the moment. There is no way to trigger that from outside the page, by design.',
    '',
    '## HTTP endpoints',
    '',
    `- \`GET ${url('/api/net/ping')}\` — 204, uncached. Round-trip latency.`,
    `- \`GET ${url('/api/net/download')}?bytes=N\` — N random bytes, up to 64MB, uncompressed.`,
    `- \`POST ${url('/api/net/upload')}\` — drains the body, replies \`{"received":N}\`.`,
    '',
    'No authentication. They exist to measure a link, not to serve data.',
    '',
  ].join('\n');
}

/** RFC 9116. Expires is required, so it is computed rather than written down. */
export function securityTxt() {
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  return [
    `Contact: ${REPO}/security/advisories/new`,
    'Contact: mailto:hello@profullstack.com',
    'Contact: https://profullstack.com',
    `Expires: ${expires.toISOString()}`,
    'Preferred-Languages: en',
    `Canonical: ${url('/.well-known/security.txt')}`,
    `Policy: ${REPO}/blob/master/README.md`,
    '',
  ].join('\n');
}

/**
 * Named crawlers get their own block. A bot that finds no block of its own
 * falls back to `User-agent: *`, which works, but several of these read an
 * explicit entry as the difference between "allowed" and "not considered".
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'meta-externalagent',
  'Amazonbot',
  'DuckAssistBot',
  'cohere-ai',
];

export function robotsTxt() {
  // Every group carries the same two rules. A parser that takes only the first
  // matching group still gets the whole policy, which a second `User-agent: *`
  // block further down would not guarantee.
  const group = (agent) => [`User-agent: ${agent}`, 'Allow: /', 'Disallow: /api/', ''];

  const lines = [
    '# Everything here is public and MIT licensed. The only thing worth keeping a',
    '# crawler out of is /api/, which moves real bytes for the speed test and means',
    '# nothing to a reader.',
    '',
    ...group('*'),
    '# Answer engines and AI crawlers, named so none of them has to infer its',
    '# permission from the wildcard above.',
    '',
    ...AI_CRAWLERS.flatMap(group),
    `Sitemap: ${url('/sitemap.xml')}`,
    '',
  ];
  return lines.join('\n');
}

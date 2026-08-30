/**
 * What changed, and when. Written by hand rather than generated from git log:
 * a commit subject is addressed to whoever is reading the diff, and most of
 * them say nothing to someone who wants to know whether the thing they use got
 * better. Entries are newest first, and every one of them is a change a reader
 * could notice.
 *
 * This is the only copy. The page, the sitemap and llms.txt all read it here,
 * so an entry cannot exist in one and be missing from another.
 */
export const CHANGELOG = [
  {
    date: '2026-08-30',
    title: 'A way to reach a human, and a place in the hierarchy',
    items: [
      'Added an email address that is not a GitHub account. It is on the About page, in the footer, and in security.txt, llms.txt and skill.md — a fifteen-engine audit could not work out how to contact anyone, and neither could a reader without a GitHub login.',
      'The four pages that describe the project — About, Privacy, Desktop app and This machine — now carry breadcrumbs. The 24 instruments always had them; the pages explaining the thing did not.',
      'The publisher now declares a logo, so a knowledge panel can show a mark instead of a letter.',
      'The offline banner is no longer the first sentence in the source of all 29 pages. It is hidden until a script shows it, so no reader ever saw it there — only text extractors, which read the same opening off every page and concluded they were the same page.',
    ],
  },
  {
    date: '2026-08-29',
    title: 'Written down for the machines that read it',
    items: [
      'Published llms.txt, llms-full.txt and skill.md, and named every answer-engine crawler explicitly in robots.txt rather than leaving each to infer its permission from the wildcard.',
      'Every browser API named on an instrument now links to its MDN page. Naming an API is only useful if you can go and read what it is and who implements it.',
      'Each instrument gained a short FAQ answering the question it leaves you with — what a normal reading looks like, and what it means when the number is not that.',
      'Fixed a keyboard trap and a broken heading outline.',
      'Turned on compression and caching, and locked down what the page is allowed to load.',
    ],
  },
  {
    date: '2026-08-28',
    title: 'Paying for it without selling you',
    items: [
      'The one advertisement is a sandboxed frame, not the vendor’s script. A script would have cost an open image policy site-wide and would have written a permanent visitor id to your device. This does neither.',
      'Wired up the generated icon set, so an installed app has a real icon at every size.',
      'A URL with a trailing slash now serves the page instead of returning 404.',
    ],
  },
  {
    date: '2026-08-24',
    title: 'First release',
    items: [
      '24 instruments that run in the browser, install as a progressive web app, and ship as a desktop build for Windows, macOS and Linux.',
      'The desktop app is an app shell rather than the website in a window, so it can read the things a browser is not allowed to see.',
    ],
  },
];

/** The newest entry's date — the honest "last changed" for the whole site. */
export const lastChanged = CHANGELOG[0].date;

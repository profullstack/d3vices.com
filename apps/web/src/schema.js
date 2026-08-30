import { config } from '@d3vices/config';

/**
 * A BreadcrumbList for a page that sits one level under the homepage.
 *
 * Every page here is one hop from the root, so the trail is always the same
 * shape: d3vices, then this page. Building it in one place keeps the `item`
 * URLs absolute and identical to the canonical the Layout emits — a breadcrumb
 * whose item does not match the canonical describes a page that does not exist.
 */
export function breadcrumb(name, path) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'd3vices', item: config.siteUrl },
      { '@type': 'ListItem', position: 2, name, item: `${config.siteUrl}${path}` },
    ],
  };
}

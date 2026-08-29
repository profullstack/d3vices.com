import { describe, expect, test } from 'bun:test';
import { API_DOCS } from '../packages/tests/src/api-docs.js';
import { GROUPS, TEST_BY_ID, TEST_BY_SLUG, TESTS, testsInGroup } from '../packages/tests/src/registry.js';

describe('test registry', () => {
  test('every id and slug is unique', () => {
    expect(new Set(TESTS.map((t) => t.id)).size).toBe(TESTS.length);
    expect(new Set(TESTS.map((t) => t.slug)).size).toBe(TESTS.length);
  });

  test('every test belongs to a declared group', () => {
    const groups = new Set(GROUPS.map((g) => g.id));
    for (const t of TESTS) expect(groups.has(t.group)).toBe(true);
  });

  test('no group is empty, or it would render an empty nav menu', () => {
    for (const g of GROUPS) expect(testsInGroup(g.id).length).toBeGreaterThan(0);
  });

  test('every API a test names has somewhere to read about it', () => {
    // The page falls back to plain text for an unknown name, so a missing link
    // is invisible in the browser. This is what catches it.
    for (const t of TESTS) {
      for (const api of t.apis) expect(API_DOCS[api]).toBeTruthy();
    }
  });

  test('every test carries questions of its own', () => {
    for (const t of TESTS) expect(t.faq.length).toBeGreaterThanOrEqual(3);
  });

  test('every test carries the copy the page and the sitemap need', () => {
    for (const t of TESTS) {
      expect(t.name.length).toBeGreaterThan(3);
      expect(t.short.length).toBeGreaterThan(2);
      expect(t.blurb.length).toBeGreaterThan(30);
      // Meta descriptions get truncated in results below ~120 characters.
      expect(t.description.length).toBeGreaterThan(80);
      expect(Array.isArray(t.apis)).toBe(true);
      expect(t.apis.length).toBeGreaterThan(0);
      expect(Array.isArray(t.platforms)).toBe(true);
    }
  });

  test('slugs are URL safe and do not collide with the static routes', () => {
    const reserved = new Set(['about', 'privacy', 'download', 'static', 'api', 'sw.js', 'healthz']);
    for (const t of TESTS) {
      expect(t.slug).toMatch(/^[a-z0-9-]+$/);
      expect(reserved.has(t.slug)).toBe(false);
    }
  });

  test('lookup maps agree with the list', () => {
    for (const t of TESTS) {
      expect(TEST_BY_ID[t.id]).toBe(t);
      expect(TEST_BY_SLUG[t.slug]).toBe(t);
    }
  });
});

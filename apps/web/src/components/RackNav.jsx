import { GROUPS, testsInGroup } from '@d3vices/tests/registry';

/**
 * Rack codes (A-01, C-04) come from the group order and the test's position
 * inside it, so adding a test never means maintaining a label by hand.
 */
const GROUP_LETTER = Object.fromEntries(GROUPS.map((group, i) => [group.id, String.fromCharCode(65 + i)]));

export function rackCode(test) {
  const index = testsInGroup(test.group).findIndex((t) => t.id === test.id);
  return `${GROUP_LETTER[test.group] ?? '?'}-${String(index + 1).padStart(2, '0')}`;
}

export function groupLetter(groupId) {
  return GROUP_LETTER[groupId] ?? '?';
}

export function RackNav({ current, class: className = 'rack-nav' }) {
  return (
    <nav class={className} aria-label="All tests">
      {GROUPS.map((group) => (
        <div>
          <div class="rack-group">
            {GROUP_LETTER[group.id]} — {group.name.toUpperCase()}
          </div>
          {testsInGroup(group.id).map((test) => (
            <a
              class={test.id === current ? 'rack-link is-current' : 'rack-link'}
              href={`/${test.slug}`}
              aria-current={test.id === current ? 'page' : undefined}
            >
              {test.short}
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
}

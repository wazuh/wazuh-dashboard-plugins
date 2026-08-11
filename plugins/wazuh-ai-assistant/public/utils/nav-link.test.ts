import assert from 'node:assert/strict';
import {
  WAZUH_HOME_APP_CATEGORY,
  WAZUH_HOME_CATEGORY_ID,
  WAZUH_HOME_CATEGORY_ORDER,
} from '../../common/nav-categories';

/**
 * Guards the navigation placement decided by CEO direction, which supersedes issue #8895: "Meter
 * el AI assistant mejor en la home, no pongáis una sección AI solo para esto" — the assistant must
 * NOT sit in a dedicated AI-only section, classic or new navigation. It previously had its own
 * top-level `AI` category (and matching new-navigation nav-group category); both are gone. These
 * assertions exist so an edit that reintroduces a dedicated AI category, or drifts the shared
 * category id away from the main plugin's `Home` category, fails loudly here.
 */

test('the classic-navigation category is the shared Home id, not a dedicated AI one', () => {
  assert.equal(WAZUH_HOME_APP_CATEGORY.id, WAZUH_HOME_CATEGORY_ID);
  assert.equal(
    WAZUH_HOME_CATEGORY_ID,
    'wz-category-home',
    "must match plugins/main/public/utils/applications.ts's Categories entry with the same id, " +
      "or the two plugins' registrations split into two separate groups in the sidebar",
  );
  assert.notEqual(
    WAZUH_HOME_CATEGORY_ID,
    'wazuh-ai',
    'must not resurrect the dedicated AI-only category CEO direction removed',
  );
});

test('the Home category is labelled "Home", matching the main plugin\'s category exactly', () => {
  assert.equal(WAZUH_HOME_APP_CATEGORY.label, 'Home');
});

test("the Home category order matches the main plugin's Home category (0)", () => {
  assert.equal(WAZUH_HOME_CATEGORY_ORDER, 0);
  assert.equal(WAZUH_HOME_APP_CATEGORY.order, 0);
});

test("the Home category icon matches the main plugin's Home category", () => {
  assert.equal(WAZUH_HOME_APP_CATEGORY.euiIconType, 'appSearchApp');
});

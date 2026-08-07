import assert from 'node:assert/strict';
import {
  WAZUH_AI_APP_CATEGORY,
  WAZUH_AI_CATEGORY_ID,
  WAZUH_AI_CATEGORY_ORDER,
  WAZUH_AI_NAV_CATEGORY,
  WAZUH_AI_NAV_GROUP_ORDER,
} from '../../../wazuh-core/common/nav-categories';

/**
 * Guards the navigation placement decided in issue #8895. The assistant was previously filed under
 * the framework's generic `Explore` category with a plain `chatRight` glyph; both were inherited
 * defaults. These assertions exist so an edit that reverts the placement, renames the category, or
 * swaps the icon back out of EUI's `*App` family fails loudly here rather than being noticed only by
 * someone looking at the sidebar.
 *
 * The two nav systems are asserted SEPARATELY on purpose: they must share the category `id` (that is
 * what makes them agree) while carrying DIFFERENT order values, because the classic navigation
 * numbers Wazuh categories 200-700 and the newer one numbers the same categories 300-800. Assuming a
 * single shared order is exactly how a category lands correctly in one navigation and wrong in the
 * other.
 */

test('the AI category id is shared by both navigation systems', () => {
  assert.equal(WAZUH_AI_APP_CATEGORY.id, WAZUH_AI_CATEGORY_ID);
  assert.equal(WAZUH_AI_NAV_CATEGORY.id, WAZUH_AI_CATEGORY_ID);
  assert.equal(
    WAZUH_AI_APP_CATEGORY.id,
    WAZUH_AI_NAV_CATEGORY.id,
    'both navigations must group under the same category id or the entry splits in two',
  );
});

test('the AI category is labelled "AI" — unbranded and sentence case, like every sibling', () => {
  // Sibling categories are `Endpoint security`, `Threat intelligence`, `Security operations`,
  // `Cloud security`, `Agents management`, `System inventory`, `Server management`. None carries the
  // product name, because the navigation already sits under Wazuh chrome. `AI` is also a container
  // that can hold further AI capabilities later without a rename.
  assert.equal(WAZUH_AI_APP_CATEGORY.label, 'AI');
  assert.equal(WAZUH_AI_NAV_CATEGORY.label, 'AI');
});

test('the AI category sits directly below Home in each navigation, using that navigation own scale', () => {
  // Classic navigation orders: Home 0, Endpoint security 200 -> 100 is the free slot between them.
  assert.equal(WAZUH_AI_CATEGORY_ORDER, 100);
  assert.ok(
    WAZUH_AI_CATEGORY_ORDER > 0 && WAZUH_AI_CATEGORY_ORDER < 200,
    'must fall between Home (0) and Endpoint security (200)',
  );
  // New navigation orders start at Endpoint security 300, so 200 keeps AI immediately above it.
  assert.equal(WAZUH_AI_NAV_GROUP_ORDER, 200);
  assert.ok(
    WAZUH_AI_NAV_GROUP_ORDER < 300,
    'must sort above Endpoint security (300) in the new navigation',
  );
  assert.notEqual(
    WAZUH_AI_CATEGORY_ORDER,
    WAZUH_AI_NAV_GROUP_ORDER,
    'the two navigations use different category order scales; collapsing them to one number ' +
      'misplaces the category in one of them',
  );
});

test('the AI category icon stays inside EUI app-icon family', () => {
  // Every Wazuh navigation entry uses an `*App` icon; `chatRight` (the previous value) was a plain UI
  // glyph. `bolt` and `logoAWSMono` are the only pre-existing exceptions to that convention.
  assert.equal(WAZUH_AI_APP_CATEGORY.euiIconType, 'machineLearningApp');
  assert.match(
    WAZUH_AI_APP_CATEGORY.euiIconType,
    /App$/,
    'icon must come from EUI app-icon family to match the rest of the navigation',
  );
});

test('the new-navigation category carries no icon', () => {
  // Nav groups take their icon from the group, not the category, so declaring one here would be
  // dead configuration that later reads as an inconsistency with the classic category object.
  assert.equal(
    (WAZUH_AI_NAV_CATEGORY as { euiIconType?: string }).euiIconType,
    undefined,
  );
});

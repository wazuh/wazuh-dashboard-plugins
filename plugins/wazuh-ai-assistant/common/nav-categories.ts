import { i18n } from '@osd/i18n';

/**
 * Wazuh navigation-category definition for the AI layer (issue #8895).
 *
 * Lives in THIS plugin's `common/` because the assistant is the only application in the AI category.
 * The main `wazuh` plugin deliberately does NOT declare this category: no main-plugin application
 * belongs to it, and registering it there can render an empty group in that plugin's own menus. With
 * a single owner there is no cross-plugin copy to keep in sync, so the literal lives with its
 * consumer.
 *
 * It was first written into `wazuh-core/common` to be "shared", which does NOT work here: a
 * cross-plugin VALUE import cannot resolve in this plugin's build and test tree, where sibling
 * plugins are not present. The main plugin gets away with importing from `wazuh-core` only because
 * its import is type-only and therefore erased at compile time. Should a second plugin ever need
 * this category, promoting it to `wazuh-core` also means giving that plugin's jest config and build
 * access to the sibling source it would then depend on.
 *
 * `common/` rather than `public/`: it is an isomorphic constant with no browser or Node dependency,
 * per this repo's layering rules.
 *
 * Note a category cannot be published through a plugin setup/start contract either, because
 * consumers need it during `application.register()` inside their own `setup()`, before any plugin
 * contract is available to them. A static import is the only mechanism in scope at that point.
 */

/**
 * The AI capability layer — a top-level category holding the AI Assistant today, and further AI
 * capabilities (insights, settings, saved conversations) as they arrive, without needing a rename.
 *
 * `AI` is deliberately unbranded and sentence case, matching every sibling category (`Endpoint
 * security`, `Threat intelligence`, ...) — none of which carries the product name, since the whole
 * navigation already sits under Wazuh chrome.
 *
 * The assistant is CROSS-CUTTING: it answers across findings, vulnerabilities, agents, configuration
 * assessment, file integrity, MITRE ATT&CK and system inventory. That is precisely why it needs its
 * own category instead of a better-fitting existing one — filing it under any single domain would
 * present it as a sub-feature of that domain.
 */
export const WAZUH_AI_CATEGORY_ID = 'wazuh-ai';

/** Order `100`: the unused slot directly below `Home` (0) and above `Endpoint security` (200) in the
 * CLASSIC navigation's ordering. The newer navigation numbers the same categories differently
 * (300-800 rather than 200-700), so its own order is stated separately at its registration site
 * rather than reusing this value — see `WAZUH_AI_NAV_GROUP_ORDER`. */
export const WAZUH_AI_CATEGORY_ORDER = 100;

/** Order for the same category in the NEW navigation, whose category ordering starts at 300
 * (`Endpoint security`). `200` keeps the AI layer immediately above it there too. Kept distinct from
 * `WAZUH_AI_CATEGORY_ORDER` on purpose: assuming one shared number is how a category ends up
 * correctly placed in one navigation and misplaced in the other. */
export const WAZUH_AI_NAV_GROUP_ORDER = 200;

/** Human label, resolved once so both navigation paths show the same string. */
export function getWazuhAiCategoryLabel(): string {
  return i18n.translate('wazuhCore.navCategory.ai', { defaultMessage: 'AI' });
}

/** The category object for `application.register()` (classic navigation). */
export const WAZUH_AI_APP_CATEGORY = {
  id: WAZUH_AI_CATEGORY_ID,
  get label(): string {
    return getWazuhAiCategoryLabel();
  },
  order: WAZUH_AI_CATEGORY_ORDER,
  euiIconType: 'machineLearningApp',
};

/** The category object for `chrome.navGroup.addNavLinksToGroup()` (new navigation). Same id — that is
 * what makes the two navigations agree — but the new navigation's own order, and no icon, since nav
 * groups take the icon from the group rather than the category. */
export const WAZUH_AI_NAV_CATEGORY = {
  id: WAZUH_AI_CATEGORY_ID,
  get label(): string {
    return getWazuhAiCategoryLabel();
  },
  order: WAZUH_AI_NAV_GROUP_ORDER,
};

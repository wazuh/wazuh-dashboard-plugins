import { i18n } from '@osd/i18n';

/**
 * Wazuh navigation placement for the AI Assistant app.
 *
 * Product direction: put the AI Assistant into Home instead of carving out a dedicated AI-only
 * section for it. The assistant no longer has its own top-level `AI` category (classic
 * navigation) or nav group category (new navigation); there is no AI-only navigation section
 * anywhere.
 *
 * Instead, the app joins the existing `Home` category — the one the main `wazuh` plugin's own
 * Overview app (`wz-home`) already uses (`plugins/main/public/utils/applications.ts`) — so the
 * assistant now surfaces right where Home already lives, exactly as directed, rather than
 * presenting as a sibling of Endpoint security / Threat intelligence / etc.
 *
 * `Home`'s id/label/icon/order are duplicated here (rather than imported) because they are a
 * plain object literal owned by the main plugin, not exported through any shared package, and a
 * cross-plugin VALUE import cannot resolve in this plugin's own build/test tree (see this file's
 * previous revision for the fuller explanation of that constraint — it still applies). What makes
 * two plugins' registrations land in the SAME sidebar group is agreeing on the category `id`
 * (`wz-category-home`), which this file keeps in sync with `plugins/main/public/utils/
 * applications.ts`'s `Categories` entry of the same id.
 *
 * `common/` rather than `public/`: it is an isomorphic constant with no browser or Node
 * dependency, per this repo's layering rules, and (as before) a category cannot be published
 * through a plugin setup/start contract — consumers need it during `application.register()`
 * inside their own `setup()`, before any plugin contract is available to them.
 */

/** Must equal `plugins/main/public/utils/applications.ts`'s `Categories` entry with the same id —
 * that agreement is what merges the two plugins' registrations into one sidebar group. */
export const WAZUH_HOME_CATEGORY_ID = 'wz-category-home';

/** Matches the main plugin's `Categories` entry for `wz-category-home` (order `0`, directly above
 * `Endpoint security` at `200`). Classic-navigation-only: the new navigation's own category
 * mapping (`CATEGORY_TO_NAV_CATEGORY` in `plugins/main/public/utils/nav-groups.ts`) does not map
 * `wz-category-home` to a nav-group category at all, so the Overview app it already contains
 * surfaces ungrouped there — this app now matches that same, deliberately uncategorized,
 * treatment in the new navigation (see `public/utils/nav-link.ts`). */
export const WAZUH_HOME_CATEGORY_ORDER = 0;

/** Human label, matching the main plugin's `Home` category string exactly. */
export function getWazuhHomeCategoryLabel(): string {
  return i18n.translate('wazuhAiAssistant.navCategory.home', {
    defaultMessage: 'Home',
  });
}

/** The category object for `application.register()` (classic navigation). */
export const WAZUH_HOME_APP_CATEGORY = {
  id: WAZUH_HOME_CATEGORY_ID,
  get label(): string {
    return getWazuhHomeCategoryLabel();
  },
  order: WAZUH_HOME_CATEGORY_ORDER,
  euiIconType: 'appSearchApp',
};

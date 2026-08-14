import { i18n } from '@osd/i18n';
import { CoreSetup, DEFAULT_NAV_GROUPS } from '../../../../src/core/public';
import { PLUGIN_ID } from '../../common/constants';

/**
 * New-navigation registration for the AI Assistant.
 *
 * There are TWO independent navigation systems, and the `category` passed to
 * `application.register()` only drives the CLASSIC one. The newer navigation — active when the
 * `home:useNewHomePage` advanced setting is enabled — is populated by nav-group registration
 * instead, so an app that sets only its `category` is placed correctly in one navigation and left
 * ungrouped in the other. That asymmetry is why this file exists.
 *
 * Deliberately registered with NO `category` (CEO direction supersedes issue #8895 — see
 * `common/nav-categories.ts`'s doc comment): the new navigation's own category mapping
 * (`CATEGORY_TO_NAV_CATEGORY` in `plugins/main/public/utils/nav-groups.ts`) does not map the
 * classic `wz-category-home` category this app now joins (see `plugin.ts`) to any nav-group
 * category either — the main plugin's own Overview/Home app surfaces ungrouped in the new
 * navigation for the same reason. Matching that treatment here, rather than inventing a new
 * nav-group category, keeps the app out of any dedicated AI section in BOTH navigations.
 *
 * Mirrors how the main `wazuh` plugin registers its own applications (`main/public/utils/
 * nav-groups.ts`): same API, same `DEFAULT_NAV_GROUPS.all` target, and the same `setup()` lifecycle
 * phase. The difference is ownership — the assistant registers its own link here rather than being
 * added to the main plugin's application array, so the app stays owned by the plugin that defines it
 * and the main plugin's list stays the set of applications IT provides.
 */

/** Shape of the nav-link config `chrome.navGroup.addNavLinksToGroup` accepts. Declared locally, as
 * the main plugin also does, because the platform does not export a type for it. */
interface NavLinkConfig {
  id: string;
  title?: string;
  order?: number;
  category?: { id: string; label: string; order?: number };
}

/**
 * Adds the AI Assistant to the new navigation, ungrouped — see the file doc comment above for why
 * no category is set here.
 *
 * No-op when the new navigation is disabled — matching the main plugin's guard, so nothing is
 * registered against a navigation the deployment is not using.
 */
export function registerAiNavLink(core: CoreSetup): void {
  const navGroup = core.chrome?.navGroup;

  // Defensive: `chrome.navGroup` is the newer platform API this integration depends on. Guarding
  // means an older platform build degrades to the classic navigation (which the app's own
  // `category` already handles) instead of throwing during setup and taking the whole plugin down.
  if (!navGroup?.getNavGroupEnabled?.() || !navGroup.addNavLinksToGroup) {
    return;
  }

  const navLink: NavLinkConfig = {
    id: PLUGIN_ID,
    title: i18n.translate('wazuhAiAssistant.app.title', {
      defaultMessage: 'AI Assistant',
    }),
    // No `category` — see this function's doc comment: the app now joins Home in the classic
    // navigation, and Home itself is registered ungrouped in this newer one, so this link matches
    // that same ungrouped treatment rather than inventing a nav-group category of its own.
  };

  navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [navLink]);
}

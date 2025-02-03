import { first } from 'rxjs/operators';
import { CoreStart, NavGroupItemInMap } from '../../../../src/core/public';

/**
 * The function `navigateToFirstAppInNavGroup` navigates to the first app in a
 * specified navigation group if it exists.
 * @param {CoreStart} core - The `core` parameter is an object that provides access
 * to core services in Kibana, such as application navigation, HTTP requests, and
 * more. It is typically provided by the Kibana platform to plugins and can be used
 * to interact with various functionalities within the Kibana application.
 * @param {NavGroupItemInMap | undefined} navGroup - The `navGroup` parameter is
 * expected to be an object that represents a navigation group item in a map. It
 * should have a property `navLinks` which is an array of navigation links. Each
 * navigation link in the `navLinks` array should have an `id` property that
 * represents the ID
 */
export async function navigateToFirstAppInNavGroup(
  core: CoreStart,
  navGroup: NavGroupItemInMap | undefined,
) {
  // Get the first nav item, if it exists navigate to the app
  const firstNavItem = navGroup?.navLinks[0];

  if (firstNavItem?.id) {
    core.application.navigateToApp(firstNavItem.id);
  }
}

export async function getCurrentNavGroup(core: CoreStart) {
  return core.chrome.navGroup.getCurrentNavGroup$().pipe(first()).toPromise();
}

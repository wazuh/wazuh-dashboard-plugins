import { first } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Logger } from '@osd/logging';
import {
  App,
  AppMount,
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
  CoreSetup,
  CoreStart,
  NavGroupItemInMap,
} from '../../../../../src/core/public';
import { AppUpdaterNotFoundError } from './errors/app-updater-not-found-error';
import { AppOperations } from './types';

export class ApplicationService {
  /**
   * Usage: Used to emit updates (for example, changes in navigation link
   * visibility) to registered applications or application groups.
   */
  private readonly appUpdater$: Partial<Record<string, Subject<AppUpdater>>> =
    {};
  /**
   * Usage: Used to notify the startup event of an application (or group) and,
   * from it, update the application navigation (for example, setting the
   * current group and navigating to the first app in the group).
   */
  private readonly appStartup$ = new Subject<string>();

  constructor(private readonly logger?: Logger) {}

  /**
   * Asynchronously gets the current navigation group.
   */
  async getCurrentNavGroup(core: CoreStart) {
    return core.chrome.navGroup.getCurrentNavGroup$().pipe(first()).toPromise();
  }

  /**
   * Registers (or initializes) an updater for a specific appId (in practice,
   * for a navigation group).
   *
   * @param {string} appId - This parameter is a string that represents the
   * unique identifier of the application for which you want to register an app
   * updater.
   */
  registerAppUpdater(appId: string) {
    this.logger?.debug(`registerAppUpdater (AppId: ${appId})`);
    this.appUpdater$[appId] = new Subject<AppUpdater>();
  }

  /**
   * This method retrieves the app updater for a specific app ID, throwing an
   * error if the updater is not found.
   * @param {string} appId - This method is used to retrieve an app updater
   * based on the provided `appId`. If the app updater for the specified `appId`
   * does not exist, it throws an `AppUpdaterNotFoundError` with the `appId`
   * @returns This method is returning the app updater object associated with
   * the provided `appId`. If the app updater object does not exist for the
   * given `appId`, it will throw an `AppUpdaterNotFoundError` with the `appId`
   * that was passed as an argument.
   */
  getAppUpdater(appId: string) {
    this.logger?.debug(`getAppUpdater ${appId}`);

    if (!this.appUpdater$[appId]) {
      this.logger?.error(`getAppUpdater ${appId}`);
      throw new AppUpdaterNotFoundError(appId);
    }

    return this.appUpdater$[appId];
  }

  /**
   * This method returns a partial object of type App where the navLinkStatus
   * property is set to visible.
   * @returns A partial object of the App interface is being returned with the
   * property `navLinkStatus` set to `AppNavLinkStatus.visible`.
   */
  private setNavLinkVisible(): Partial<App> {
    this.logger?.debug('setNavLinkVisible');

    return {
      navLinkStatus: AppNavLinkStatus.visible,
    };
  }

  /**
   * This method returns a partial object with the navLinkStatus property set
   * to hidden.
   * @returns A partial object of the App interface is being returned with the
   * navLinkStatus property set to AppNavLinkStatus.hidden.
   */
  private setNavLinkHidden(): Partial<App> {
    this.logger?.debug('setNavLinkHidden');

    return {
      navLinkStatus: AppNavLinkStatus.hidden,
    };
  }

  /**
   * Extracts the navigation group identifier from the appId.
   */
  private getNavGroupId(appId: string): string {
    return appId.split('_%2F')[0];
  }

  /**
   * The method initializes and registers the mounting of a set of
   * applications that belong to navigation groups.
   * @param {App[]} apps - This parameter is an array of objects representing
   * different applications. Each object contains information about a specific
   * app, such as its ID, name, and mount function.
   * @param {CoreSetup} core - This parameter is used to access core
   * functionalities and services provided by the application framework. This
   * parameter is typically used to register applications, access the Chrome
   * service for navigation group settings, and perform other core setup
   * @param {AppOperations} [appOperations] - This parameter is an optional
   * object that contains two properties: `beforeMount` and `cleanup`. These
   * properties are functions that are executed before and after mounting each
   * application, respectively. The `beforeMount` function is used to prepare
   * the application for mounting, while the `cleanup` function is used to clean
   * up the application after it has been unmounted.
   */
  initializeNavGroupMounts(
    apps: App[],
    core: CoreSetup,
    appOperations?: AppOperations,
  ) {
    this.logger?.debug('initializeNavGroupMounts');

    const beforeMount = appOperations?.beforeMount ?? this.setNavLinkVisible;

    for (const app of apps) {
      this.logger?.debug(`initializeApp ${app.id}`);

      const mount = app.mount.bind(app) as AppMount;
      const navGroupId = this.getNavGroupId(app.id);

      app.mount = async (params: AppMountParameters) => {
        if (core.chrome.navGroup.getNavGroupEnabled()) {
          this.getAppUpdater(navGroupId).next(beforeMount);
          this.appStartup$.next(navGroupId);
        }

        const unmount = await mount(params);

        return () => {
          this.logger?.debug(`unmount ${app.id}`);

          unmount();

          return true;
        };
      };

      core.application.register(app);
    }
  }

  /**
   * The method initializes and registers the mounting of sub-applications,
   * adding logic for both mounting and cleanup (unmounting).
   * @param {App[]} apps - This parameter is an array of objects representing
   * different applications. Each object contains information about a specific
   * app, such as its ID, name, and mount function.
   * @param {CoreSetup} core - This parameter in the is used to access core
   * services and functionalities provided by the application framework. This
   * parameter is typically used to register applications, access the Chrome
   * service for UI components, and perform other core setup tasks
   * @param {AppOperations} [appOperations] - This parameter is an optional
   * object that contains two properties: `beforeMount` and `cleanup`. These
   * properties are functions that are executed before and after mounting each
   * application, respectively. The `beforeMount` function is used to prepare
   * the application for mounting, while the `cleanup` function is used to clean
   * up the application after it has been unmounted.
   */
  initializeSubApplicationMounts(
    apps: App[],
    core: CoreSetup,
    appOperations?: AppOperations,
  ) {
    this.logger?.debug('initializeSubApplicationMounts');

    const beforeMount = appOperations?.beforeMount ?? this.setNavLinkVisible;
    const cleanup = appOperations?.cleanup ?? this.setNavLinkHidden;

    for (const app of apps) {
      this.logger?.debug(`initializeApp ${app.id}`);

      const mount = app.mount.bind(app) as AppMount;
      const navGroupId = this.getNavGroupId(app.id);

      app.mount = async (params: AppMountParameters) => {
        if (core.chrome.navGroup.getNavGroupEnabled()) {
          this.getAppUpdater(navGroupId).next(beforeMount);
        }

        const unmount = await mount(params);

        return () => {
          this.logger?.debug(`unmount ${app.id}`);

          if (core.chrome.navGroup.getNavGroupEnabled()) {
            this.getAppUpdater(navGroupId).next(cleanup);
          }

          unmount();

          return true;
        };
      };

      core.application.register(app);
    }
  }

  /**
   * The method ensures that, after an application starts, the interface updates
   * to reflect the active group and automatically redirects the user to the
   * first available application in that group.
   * @param {CoreStart} core - This parameter is an object that provides access
   * to various services and functionalities within the application. It is
   * typically passed in as a parameter to allow the method to interact with
   * the application's core services, such as navigation, UI components, data
   * fetching, and more.
   */
  onAppStartupSubscribe(core: CoreStart) {
    this.appStartup$.subscribe({
      next: async (navGroupId: string) => {
        this.logger?.debug(`onAppStartupSubscribe ${navGroupId}`);

        if (core.chrome.navGroup.getNavGroupEnabled()) {
          core.chrome.navGroup.setCurrentNavGroup(navGroupId);

          const currentNavGroup = await this.getCurrentNavGroup(core);

          this.navigateToFirstAppInNavGroup(core, currentNavGroup);
        }
      },
    });
  }

  /**
   * This method navigates to the first application (or link) in the specified
   * navigation group if it exists.
   * @param {CoreStart} core - This parameter is an object that provides access
   * to core services in Kibana, such as application navigation, HTTP requests,
   * and more. It is typically provided by the Kibana platform to plugins and
   * can be used to interact with various functionalities within the Kibana
   * application.
   * @param {NavGroupItemInMap | undefined} navGroup - This parameter is
   * expected to be an object that represents a navigation group item in a map.
   * It should have a property `navLinks` which is an array of navigation links.
   * Each navigation link in the `navLinks` array should have an `id` property
   * that represents the ID
   */
  async navigateToFirstAppInNavGroup(
    core: CoreStart,
    navGroup: NavGroupItemInMap | undefined,
  ) {
    this.logger?.debug('navigateToFirstAppInNavGroup');

    // Get the first nav item, if it exists navigate to the app
    const firstNavItem = navGroup?.navLinks[0];

    if (firstNavItem?.id) {
      core.application.navigateToApp(firstNavItem.id);
    }
  }
}

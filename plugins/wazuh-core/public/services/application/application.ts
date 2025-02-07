import { Logger } from '@osd/logging';
import { Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import {
  App,
  AppMount,
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
  CoreSetup,
  CoreStart,
  DEFAULT_NAV_GROUPS,
  NavGroupItemInMap,
} from '../../../../../src/core/public';
import { searchPages } from '../../components/global_search/search-pages-command';
import { getCore } from '../../plugin-services';
import { AppUpdaterNotFoundError } from './errors/app-updater-not-found-error';
import { AppOperations, Group } from './types';

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

  constructor(
    private readonly logger: Logger,
    private readonly coreSetup: CoreSetup,
  ) {
    this.logger = logger.get('ApplicationService');
  }

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
    this.logger?.debug(`${this.registerAppUpdater.name} [AppId: ${appId}]`);
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
    this.logger?.debug(`${this.getAppUpdater.name} [AppId: ${appId}]`);

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
    this.logger?.debug(`${this.setNavLinkVisible.name}`);

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
    this.logger?.debug(`${this.setNavLinkHidden.name}`);

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

  private isNavGroupEnabled() {
    return this.coreSetup.chrome.navGroup.getNavGroupEnabled();
  }

  private modifyMount(app: App, appOperations?: AppOperations) {
    this.logger?.debug(`${this.modifyMount.name} [AppId: ${app.id}]`);

    const mount = app.mount.bind(app) as AppMount;

    app.mount = async (params: AppMountParameters) => {
      if (this.isNavGroupEnabled()) {
        appOperations?.beforeMount?.();
      }

      const unmount = await mount(params);

      return () => {
        this.logger?.debug(`Unmount [AppId: ${app.id}]`);

        if (this.isNavGroupEnabled()) {
          appOperations?.cleanup?.();
        }

        return unmount();
      };
    };
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
  modifyAppGroupMount(app: App) {
    this.logger?.debug(`${this.modifyAppGroupMount.name} [AppId: ${app.id}]`);

    const navGroupId = this.getNavGroupId(app.id);

    const beforeMount = () => {
      this.getAppUpdater(navGroupId).next(this.setNavLinkVisible);
      this.appStartup$.next(navGroupId);
    };

    this.modifyMount(app, { beforeMount });
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
  modifySubAppMount(app: App) {
    this.logger?.debug(`${this.modifySubAppMount.name} [AppId: ${app.id}]`);

    const navGroupId = this.getNavGroupId(app.id);

    const beforeMount = () => {
      this.getAppUpdater(navGroupId).next(this.setNavLinkVisible);
    };

    const cleanup = () => {
      this.getAppUpdater(navGroupId).next(this.setNavLinkHidden);
    };

    this.modifyMount(app, { beforeMount, cleanup });
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
  onAppStartup(core: CoreStart) {
    this.appStartup$.subscribe({
      next: async (navGroupId: string) => {
        this.logger?.debug(
          `${this.onAppStartup.name} [NavGroupId: ${navGroupId}]`,
        );

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
    this.logger?.debug(
      `${this.navigateToFirstAppInNavGroup.name} [NavGroupId: ${navGroup?.id}]`,
    );

    // Get the first nav item, if it exists navigate to the app
    const firstNavItem = navGroup?.navLinks[0];

    if (firstNavItem?.id) {
      core.application.navigateToApp(firstNavItem.id);
    }
  }

  private registerAppGroup(appGroup: App) {
    this.logger?.debug(`${this.registerAppGroup.name} [AppId: ${appGroup.id}]`);
    this.registerAppUpdater(appGroup.id);
    this.modifyAppGroupMount(appGroup);
    this.coreSetup.application.register(appGroup);
  }

  private assignNavLinksToChromeGroups(navGroup: Group<any>) {
    this.logger?.debug(
      `${this.assignNavLinksToChromeGroups.name} [NavGroupId: ${navGroup.getId()}]`,
    );
    this.coreSetup.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
      navGroup.getGroupNavLink(),
    ]);
    this.coreSetup.chrome.navGroup.addNavLinksToGroup(
      navGroup.getNavGroup(),
      navGroup.getAppsNavLinks(),
    );
  }

  private registerNavGroup(navGroup: Group<any>) {
    this.logger?.debug(
      `${this.registerNavGroup.name} [NavGroupId: ${navGroup.getId()}]`,
    );
    this.assignNavLinksToChromeGroups(navGroup);
    this.registerAppGroup(navGroup.getAppGroup());
  }

  private registerSubAppsGroups(navGroup: Group<any>) {
    this.logger?.debug(
      `${this.registerSubAppsGroups.name} [NavGroupId: ${navGroup.getId()}]`,
    );

    const subApps: App[] = navGroup.getApps(
      this.getAppUpdater(navGroup.getId()),
    );

    for (const app of subApps) {
      this.modifySubAppMount(app);
      this.coreSetup.application.register(app);
    }
  }

  private registerSearchCommand({
    id,
    navGroups,
    coreSetup,
  }: {
    id: string;
    navGroups: Group<any>[];
    coreSetup: CoreSetup;
  }) {
    this.logger?.debug(`${this.registerSearchCommand.name} [Id: ${id}]`);

    const applications: App[] = navGroups.map(navGroup =>
      navGroup.getAppGroup(),
    );
    const applicationIds = applications.map(app => app.id);

    if (coreSetup.chrome.navGroup.getNavGroupEnabled()) {
      coreSetup.chrome.globalSearch.registerSearchCommand({
        id,
        type: 'PAGES',
        run: async (query: string, done?: () => void) =>
          searchPages(query, applicationIds, getCore(), done),
      });
    }
  }

  /**
   * This method is used to add navigation links related to the specific group
   * within the OpenSearch Dashboards application.
   */
  setup({
    id,
    navGroups,
    coreSetup,
  }: {
    id: string;
    navGroups: Group<any>[];
    coreSetup: CoreSetup;
  }) {
    this.logger?.debug(`${this.setup.name} [Id: ${id}]`);

    for (const navGroup of navGroups) {
      this.registerNavGroup(navGroup);
      this.registerSubAppsGroups(navGroup);
    }

    this.registerSearchCommand({
      id,
      navGroups,
      coreSetup,
    });
  }
}

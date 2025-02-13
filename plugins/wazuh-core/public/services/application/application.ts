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
  NavGroupType,
} from '../../../../../src/core/public';
import { searchPages } from '../../components/global_search/search-pages-command';
import { getCore } from '../../plugin-services';
import { AppUpdaterNotFoundError } from './errors/app-updater-not-found-error';
import { AppOperations, Group } from './types';

interface SetupParams {
  id: string;
  navGroups: Group<any>[];
}

export class ApplicationService {
  /**
   * Stores app updaters for different applications, used to emit updates (e.g., navigation link visibility changes).
   */
  private readonly appUpdater$: Partial<Record<string, Subject<AppUpdater>>> =
    {};
  /**
   * Emits startup events for applications, allowing navigation updates (e.g., setting the current group and navigating).
   */
  private readonly appStartup$ = new Subject<string>();

  constructor(
    private readonly logger: Logger,
    private readonly coreSetup: CoreSetup,
  ) {
    this.logger = logger.get('ApplicationService');
  }

  /**
   * Retrieves the current navigation group asynchronously.
   */
  private async getCurrentNavGroup(core: CoreStart) {
    return core.chrome.navGroup.getCurrentNavGroup$().pipe(first()).toPromise();
  }

  /**
   * Registers an app updater for a given application ID, typically used for navigation group updates.
   * @param appId - Unique identifier of the application to register an updater for.
   */
  private registerAppUpdater(appId: string) {
    this.logger?.debug(`${this.registerAppUpdater.name} [AppId: ${appId}]`);
    this.appUpdater$[appId] = new Subject<AppUpdater>();
  }

  /**
   * Retrieves the app updater for a specific app ID. Throws an error if not found.
   * @param appId - Unique identifier of the application.
   * @returns The app updater associated with the given `appId`.
   * @throws {AppUpdaterNotFoundError} If no updater exists for the provided `appId`.
   */
  private getAppUpdater(appId: string) {
    this.logger?.debug(`${this.getAppUpdater.name} [AppId: ${appId}]`);

    if (!this.appUpdater$[appId]) {
      this.logger?.error(`getAppUpdater ${appId}`);
      throw new AppUpdaterNotFoundError(appId);
    }

    return this.appUpdater$[appId];
  }

  /**
   * Returns an object setting `navLinkStatus` to visible.
   */
  private setNavLinkVisible(): Partial<App> {
    return { navLinkStatus: AppNavLinkStatus.visible };
  }

  /**
   * Returns an object setting `navLinkStatus` to hidden.
   */
  private setNavLinkHidden(): Partial<App> {
    return { navLinkStatus: AppNavLinkStatus.hidden };
  }

  /**
   * Extracts the navigation group ID from an application ID.
   */
  private getNavGroupId(appId: string): string {
    return appId.split('_%2F')[0];
  }

  /**
   * Checks if navigation groups are enabled.
   */
  private isNavGroupEnabled() {
    return this.coreSetup.chrome.navGroup.getNavGroupEnabled();
  }

  /**
   * Modifies an application's mount behavior to handle lifecycle operations.
   * @param app - The application to modify.
   * @param appOperations - Optional lifecycle operations.
   */
  private modifyMount(app: App, appOperations?: AppOperations) {
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
  private modifyAppGroupMount(app: App, subApps: App[]) {
    this.logger?.debug(`${this.modifyAppGroupMount.name} [AppId: ${app.id}]`);

    const navGroupId = this.getNavGroupId(app.id);

    const beforeMount = () => {
      this.getAppUpdater(navGroupId).next(this.setNavLinkVisible);
      this.appStartup$.next(navGroupId);

      if (!getCore().chrome.navGroup.getNavGroupEnabled()) {
        getCore().application.navigateToApp(subApps[0].id);
      }
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
  private modifySubAppMount(app: App) {
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
   * @param {CoreStart} core - An object that provides access to various
   * services and functionalities within the application. It allows interaction
   * with core services such as navigation, HTTP requests, and more.
   */
  onAppStartup(core: CoreStart) {
    this.appStartup$.subscribe({
      next: async (navGroupId: string) => {
        if (core.chrome.navGroup.getNavGroupEnabled()) {
          core.chrome.navGroup.setCurrentNavGroup(navGroupId);

          const currentNavGroup = await this.getCurrentNavGroup(core);

          this.navigateToFirstAppInNavGroup(core, currentNavGroup);
        }
      },
    });
  }

  /**
   * Navigates to the first available application in in the specified navigation
   * group
   * @param {CoreStart} core - An object that provides access to various
   * services and functionalities within the application. It allows interaction
   * with core services such as navigation, HTTP requests, and more.
   * @param navGroup - Navigation group containing app links.
   */
  private async navigateToFirstAppInNavGroup(
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

  private registerAppGroup(appGroup: App, subApps: App[]) {
    this.logger?.debug(`${this.registerAppGroup.name} [AppId: ${appGroup.id}]`);
    this.registerAppUpdater(appGroup.id);
    this.modifyAppGroupMount(appGroup, subApps);
    this.coreSetup.application.register(appGroup);
  }

  private assignNavLinksToChromeGroups(navGroup: Group<any>) {
    this.logger?.debug(
      `${this.assignNavLinksToChromeGroups.name} [NavGroupId: ${navGroup.getId()}]`,
    );
    this.coreSetup.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
      navGroup.getGroupNavLink(),
    ]);

    const navGroupChromeGroup = navGroup.getNavGroup();

    navGroupChromeGroup.type = NavGroupType.SYSTEM;
    this.coreSetup.chrome.navGroup.addNavLinksToGroup(
      navGroupChromeGroup,
      navGroup.getAppsNavLinks(),
    );
  }

  /**
   * Registers a navigation group and its associated applications.
   */
  private registerNavGroup(navGroup: Group<any>) {
    this.logger?.debug(
      `${this.registerNavGroup.name} [NavGroupId: ${navGroup.getId()}]`,
    );
    this.assignNavLinksToChromeGroups(navGroup);
    this.registerAppGroup(navGroup.getAppGroup(), navGroup.getApps());
  }

  /**
   * Registers sub-applications within a navigation group.
   */
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

  /**
   * Registers a global search command for searching pages within app groups.
   */
  private registerSearchCommand({ id, navGroups }: SetupParams) {
    this.logger?.debug(`${this.registerSearchCommand.name} [Id: ${id}]`);

    const applications: App[] = navGroups.map(navGroup =>
      navGroup.getAppGroup(),
    );
    const applicationIds = applications.map(app => app.id);

    if (this.coreSetup.chrome.navGroup.getNavGroupEnabled()) {
      this.coreSetup.chrome.globalSearch.registerSearchCommand({
        id,
        type: 'PAGES',
        run: async (query: string, done?: () => void) =>
          searchPages(query, applicationIds, getCore(), done),
      });
    }
  }

  /**
   * Initializes the service by registering navigation groups and applications.
   */
  setup({ id, navGroups }: SetupParams) {
    this.logger?.debug(`${this.setup.name} [Id: ${id}]`);

    for (const navGroup of navGroups) {
      this.registerNavGroup(navGroup);
      this.registerSubAppsGroups(navGroup);
    }

    this.registerSearchCommand({ id, navGroups });
  }
}

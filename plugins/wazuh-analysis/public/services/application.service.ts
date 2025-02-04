import {
  App,
  AppMount,
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
  CoreSetup,
  CoreStart,
} from 'opensearch-dashboards/public';
import { Subject } from 'rxjs';
import { i18n } from '@osd/i18n';
import { getCurrentNavGroup } from '../utils/nav-group';
import { NavGroupItemInMap } from '../../../../src/core/public';

class AppUpdaterNotFoundError extends Error {
  constructor(appId: string) {
    super(
      i18n.translate('errors.appUpdater.NotFound', {
        defaultMessage: `AppUpdater for ${appId} not found`,
      }),
    );
    this.name = 'AppUpdaterNotFoundError';
  }
}

interface AppOperations {
  prepareApp?: () => Partial<App>;
  teardownApp?: () => Partial<App>;
}

export class ApplicationService {
  private readonly appUpdater$: Partial<Record<string, Subject<AppUpdater>>> =
    {};
  private readonly appStartup$ = new Subject<string>();

  /**
   * This function takes a parent app ID and a sub app ID, and returns a
   * combined ID with the sub app ID URL-encoded.
   * @param {string} parentAppId - Is a string representing the ID of the parent
   * application.
   * @param {string} subAppId - Is a string representing the ID of a
   * sub-application within a parent application.
   */
  static buildSubAppId(parentAppId: string, subAppId: string) {
    return `${parentAppId}_${encodeURIComponent(`/${subAppId}`)}`;
  }

  registerAppUpdater(appId: string) {
    this.appUpdater$[appId] = new Subject<AppUpdater>();
  }

  getAppUpdater(appId: string) {
    if (!this.appUpdater$[appId]) {
      throw new AppUpdaterNotFoundError(appId);
    }

    return this.appUpdater$[appId];
  }

  private setNavLinkVisible(): Partial<App> {
    return {
      navLinkStatus: AppNavLinkStatus.visible,
    };
  }

  private setNavLinkHidden(): Partial<App> {
    return {
      navLinkStatus: AppNavLinkStatus.hidden,
    };
  }

  initializeNavGroupMounts(
    apps: App[],
    core: CoreSetup,
    appOperations?: AppOperations,
  ) {
    const prepareApp = appOperations?.prepareApp ?? this.setNavLinkVisible;

    for (const app of apps) {
      const mount = app.mount.bind(app) as AppMount;

      app.mount = async (params: AppMountParameters) => {
        if (core.chrome.navGroup.getNavGroupEnabled()) {
          this.getAppUpdater(app.id).next(prepareApp);
          this.appStartup$.next(app.id);
        }

        return await mount(params);
      };

      core.application.register(app);
    }
  }

  initializeSubApplicationMounts(
    apps: App[],
    core: CoreSetup,
    appOperations?: AppOperations,
  ) {
    const prepareApp = appOperations?.prepareApp ?? this.setNavLinkVisible;
    const teardownApp = appOperations?.teardownApp ?? this.setNavLinkHidden;

    for (const app of apps) {
      const mount = app.mount.bind(app) as AppMount;

      app.mount = async (params: AppMountParameters) => {
        if (core.chrome.navGroup.getNavGroupEnabled()) {
          this.getAppUpdater(app.id).next(prepareApp);
        }

        const unmount = await mount(params);

        return () => {
          if (core.chrome.navGroup.getNavGroupEnabled()) {
            this.getAppUpdater(app.id).next(teardownApp);
          }

          unmount();

          return true;
        };
      };

      core.application.register(app);
    }
  }

  onAppStartupSubscribe(core: CoreStart) {
    this.appStartup$.subscribe({
      next: async (navGroupId: string) => {
        if (core.chrome.navGroup.getNavGroupEnabled()) {
          core.chrome.navGroup.setCurrentNavGroup(navGroupId);

          const currentNavGroup = await getCurrentNavGroup(core);

          this.navigateToFirstAppInNavGroup(core, currentNavGroup);
        }
      },
    });
  }

  /**
   * This function navigates to the first app in a specified navigation group if
   * it exists.
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
    // Get the first nav item, if it exists navigate to the app
    const firstNavItem = navGroup?.navLinks[0];

    if (firstNavItem?.id) {
      core.application.navigateToApp(firstNavItem.id);
    }
  }
}

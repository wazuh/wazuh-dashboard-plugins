import {
  App,
  AppMount,
  AppMountParameters,
  AppUpdater,
  CoreSetup,
  CoreStart,
} from 'opensearch-dashboards/public';
import { Subject } from 'rxjs';
import { i18n } from '@osd/i18n';
import {
  getCurrentNavGroup,
  navigateToFirstAppInNavGroup,
} from '../utils/nav-group';

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

  initializeNavGroupMounts(
    apps: App[],
    core: CoreSetup,
    appOperations: AppOperations,
  ) {
    for (const app of apps) {
      const mount = app.mount.bind(app) as AppMount;

      app.mount = async (params: AppMountParameters) => {
        if (core.chrome.navGroup.getNavGroupEnabled()) {
          this.getAppUpdater(app.id).next(appOperations.prepareApp);
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
    appOperations: AppOperations,
  ) {
    for (const app of apps) {
      const mount = app.mount.bind(app) as AppMount;

      app.mount = async (params: AppMountParameters) => {
        if (core.chrome.navGroup.getNavGroupEnabled()) {
          this.getAppUpdater(app.id).next(appOperations.prepareApp);
        }

        const unmount = await mount(params);

        return () => {
          if (core.chrome.navGroup.getNavGroupEnabled()) {
            this.getAppUpdater(app.id).next(appOperations.teardownApp);
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

          navigateToFirstAppInNavGroup(core, currentNavGroup);
        }
      },
    });
  }
}

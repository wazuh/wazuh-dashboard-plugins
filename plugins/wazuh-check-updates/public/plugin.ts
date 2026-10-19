import { i18n } from '@osd/i18n';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  DEFAULT_NAV_GROUPS,
  Plugin,
  PluginInitializerContext,
} from 'opensearch-dashboards/public';
import type { WazuhCheckUpdatesPluginConfigType } from '../server/index';
import {
  AppPluginStartDependencies,
  WazuhCheckUpdatesPluginSetup,
  WazuhCheckUpdatesPluginStart,
} from './types';
import { UpdatesNotification } from './components/updates-notification';
import { DismissNotificationCheck } from './components/dismiss-notification-check';
import {
  setCore,
  setWazuhCore,
  setCtiRegistrationStatusPollIntervalSec,
} from './plugin-services';
import { getAvailableUpdates } from './services';
import { CtiUpsellNotification } from './shared-components/cti-registration/components/cti-upsell-notification';
import {
  CTI_FEED_APP_ID,
  CTI_FEED_APP_ORDER,
  THREAT_INTELLIGENCE_APP_CATEGORY,
  THREAT_INTELLIGENCE_NAV_CATEGORY,
} from '../common/cti-feed';

const getCtiFeedAppTitle = () =>
  i18n.translate('wazuhCheckUpdates.ctiFeed.app.title', {
    defaultMessage: 'CTI Feed',
  });

export class WazuhCheckUpdatesPlugin
  implements Plugin<WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart>
{
  constructor(
    private readonly initializerContext: PluginInitializerContext<WazuhCheckUpdatesPluginConfigType>,
  ) {}

  public setup(core: CoreSetup): WazuhCheckUpdatesPluginSetup {
    // The CTI feed app is part of the CTI registration UI, so the same setting
    // decides whether it exists at all.
    if (this.initializerContext.config.get().ctiRegistrationUiEnabled) {
      this.registerCtiFeedApp(core);
    }
    return {};
  }

  private registerCtiFeedApp(core: CoreSetup) {
    core.application.register({
      id: CTI_FEED_APP_ID,
      title: getCtiFeedAppTitle(),
      euiIconType: 'globe',
      order: CTI_FEED_APP_ORDER,
      category: THREAT_INTELLIGENCE_APP_CATEGORY,
      mount: async (params: AppMountParameters) => {
        const [coreStart] = await core.getStartServices();
        const { renderCtiFeedApp } = await import('./components/cti-feed');
        return renderCtiFeedApp(coreStart, params);
      },
    });

    // The new navigation is populated by nav groups, not by the app category.
    const navGroup = core.chrome?.navGroup;
    if (navGroup?.getNavGroupEnabled?.() && navGroup.addNavLinksToGroup) {
      navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
        {
          id: CTI_FEED_APP_ID,
          title: getCtiFeedAppTitle(),
          order: CTI_FEED_APP_ORDER,
          category: THREAT_INTELLIGENCE_NAV_CATEGORY,
        },
      ]);
    }
  }

  public start(
    core: CoreStart,
    plugins: AppPluginStartDependencies,
  ): WazuhCheckUpdatesPluginStart {
    setCore(core);
    setWazuhCore(plugins.wazuhCore);

    const {
      ctiRegistrationUiEnabled,
      ctiUpsellEnabled,
      ctiRegistrationStatusPollIntervalSec,
    } = this.initializerContext.config.get();

    setCtiRegistrationStatusPollIntervalSec(
      ctiRegistrationStatusPollIntervalSec,
    );

    return {
      UpdatesNotification,
      getAvailableUpdates,
      DismissNotificationCheck,
      ctiRegistrationUiEnabled,
      ctiUpsellEnabled,
      ctiRegistrationStatusPollIntervalSec,
      CtiUpsellNotification,
    };
  }

  public stop() {}
}

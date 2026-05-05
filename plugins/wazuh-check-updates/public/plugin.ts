import {
  CoreSetup,
  CoreStart,
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
import { setCore, setWazuhCore } from './plugin-services';
import { getAvailableUpdates } from './services';
import { CtiRegistration } from './shared-components/cti-registration/cti-registration';

export class WazuhCheckUpdatesPlugin
  implements Plugin<WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart>
{
  constructor(
    private readonly initializerContext: PluginInitializerContext<WazuhCheckUpdatesPluginConfigType>,
  ) {}

  public setup(core: CoreSetup): WazuhCheckUpdatesPluginSetup {
    void core;
    return {};
  }

  public start(
    core: CoreStart,
    plugins: AppPluginStartDependencies,
  ): WazuhCheckUpdatesPluginStart {
    setCore(core);
    setWazuhCore(plugins.wazuhCore);

    const { ctiRegistrationUiEnabled } = this.initializerContext.config.get();

    return {
      UpdatesNotification,
      getAvailableUpdates,
      DismissNotificationCheck,
      ctiRegistrationUiEnabled,
      CtiRegistration,
    };
  }

  public stop() {}
}

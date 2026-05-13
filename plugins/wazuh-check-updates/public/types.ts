import { WazuhCorePluginStart } from '../../wazuh-core/public';
import { AvailableUpdates } from '../common/types';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WazuhCheckUpdatesPluginSetup {}

export interface WazuhCheckUpdatesPluginStart {
  UpdatesNotification: () => JSX.Element | null;
  getAvailableUpdates: (
    queryApi: boolean,
    forceQuery: boolean,
  ) => Promise<AvailableUpdates>;
  DismissNotificationCheck: () => JSX.Element | null;
  ctiRegistrationUiEnabled: boolean;
  CtiRegistration: () => JSX.Element | null;
}

export interface AppPluginStartDependencies {
  wazuhCore: WazuhCorePluginStart;
}

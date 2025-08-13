import { WazuhCorePluginStart } from '../../wazuh-core/public';
import { AvailableUpdates } from '../common/types';
import { CtiSubscriptionProps } from './shared-components/cti-subscription/types';

export interface WazuhCheckUpdatesPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCheckUpdatesPluginStart {
  UpdatesNotification: () => JSX.Element | null;
  getAvailableUpdates: (
    queryApi: boolean,
    forceQuery: boolean,
  ) => Promise<AvailableUpdates>;
  DismissNotificationCheck: () => JSX.Element | null;
  CtiSubscription: (props: CtiSubscriptionProps) => JSX.Element | null;
}

export interface AppPluginStartDependencies {
  wazuhCore: WazuhCorePluginStart;
}

import { ApisUpdateStatusProps } from './components/apis-update-status';
import { WazuhCorePluginStart } from '../../wazuh-core/public';

export interface WazuhCheckUpdatesPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCheckUpdatesPluginStart {
  UpdatesNotification: () => JSX.Element | null;
  ApisUpdateStatus: (props: ApisUpdateStatusProps) => JSX.Element;
  getAvailableUpdates: (forceUpdate: boolean) => Promise<AvailableUpdates>;
  DismissNotificationCheck: () => JSX.Element | null;
}

export interface AppPluginStartDependencies {
  wazuhCore: WazuhCorePluginStart;
}

import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import { ApisUpdateStatusProps } from './components/apis-update-status';

export interface WazuhCheckUpdatesPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCheckUpdatesPluginStart {
  UpdatesNotification: () => JSX.Element | null;
  ApisUpdateStatus: (props: ApisUpdateStatusProps) => JSX.Element;
}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}

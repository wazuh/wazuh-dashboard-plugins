import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import { CurrentUpdateDetailsProps } from './components/currentUpdateDetails';
import { UpToDateStatusProps } from './components/upToDateStatus';

export interface WazuhCheckUpdatesPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCheckUpdatesPluginStart {
  UpdatesNotification: () => JSX.Element | null;
  UpToDateStatus: (props: UpToDateStatusProps) => JSX.Element | null;
  CurrentUpdateDetails: (props: CurrentUpdateDetailsProps) => JSX.Element | null;
  DismissNotificationCheck: () => JSX.Element | null;
}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}

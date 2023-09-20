import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import { CurrentUpdateDetailsProps } from './components/current-update-details';
import { UpToDateStatusProps } from './components/up-to-date-status';

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

import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface WazuhCheckUpdatesPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCheckUpdatesPluginStart {
  UpdatesNotification: () => JSX.Element | null;
}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}

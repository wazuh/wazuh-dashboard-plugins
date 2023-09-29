import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface WazuhCorePluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginStart {
  formatUIDate: (date: Date) => string;
}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}

import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface ReportAlertsPluginPluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ReportAlertsPluginPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}

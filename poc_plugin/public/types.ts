import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import { DashboardStart } from '../../../src/plugins/dashboard/public';
import { DataPublicPluginStart } from '../../../src/plugins/data/public';

export interface PocPluginPluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PocPluginPluginStart {}

export interface AppPluginStartDependencies {
  data: NavigationPublicPluginStart;
  dashboard: DashboardStart;
  navigation: DataPublicPluginStart;
  wazuh: unknown;
}

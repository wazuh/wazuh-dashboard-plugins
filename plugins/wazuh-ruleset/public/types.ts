import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface WazuhRulesetPluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhRulesetPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}

import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface WazuhSecurityPoliciesPluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
export interface WazuhSecurityPoliciesPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}

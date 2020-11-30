import { AppMountParameters, CoreStart } from 'kibana/public';
import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
  
}
export interface AppDependencies {
  core: CoreStart;
  navigation: AppPluginStartDependencies;
  params: AppMountParameters;  
}

export type WazuhSetupDeps = {}
export type WazuhStartDeps = {}

export type WazuhSetup = {}
export type WazuhStart = {}

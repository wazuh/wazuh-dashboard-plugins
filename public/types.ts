import { AppMountParameters, CoreStart } from 'kibana/public';
import { DataPublicPluginStart } from '../../../src/plugins/data/public';
import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
}
export interface AppDependencies {
  core: CoreStart;
  plugins: AppPluginStartDependencies;
  params: AppMountParameters;  
}

export type WazuhSetupDeps = {}
export type WazuhStartDeps = {}

export type WazuhSetup = {}
export type WazuhStart = {}

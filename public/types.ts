import { AppMountParameters, CoreStart } from 'kibana/public';
import { ChartsPluginStart } from '../../../src/plugins/charts/public/plugin';
import { DiscoverStart } from '../../../src/plugins/discover/public';
import { VisualizationsStart } from '../../../src/plugins/visualizations/public';
import { DataPublicPluginStart } from '../../../src/plugins/data/public';
import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
  visualizations: VisualizationsStart;
  discover: DiscoverStart;
  charts: ChartsPluginStart
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

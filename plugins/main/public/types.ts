import { AppMountParameters, CoreStart } from 'opensearch_dashboards/public';
import { ChartsPluginStart } from '../../../src/plugins/charts/public/plugin';
import { DiscoverStart } from '../../../src/plugins/discover/public';
import {
  VisualizationsSetup,
  VisualizationsStart,
} from '../../../src/plugins/visualizations/public';
import {
  DataPublicPluginSetup,
  DataPublicPluginStart,
} from '../../../src/plugins/data/public';
import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import { UiActionsSetup } from '../../../src/plugins/ui_actions/public';
import { SecurityOssPluginStart } from '../../../src/plugins/security_oss/public/';
import { SavedObjectsStart } from '../../../src/plugins/saved_objects/public';
import {
  TelemetryPluginStart,
  TelemetryPluginSetup,
} from '../../../src/plugins/telemetry/public';
import { WazuhCheckUpdatesPluginStart } from '../../wazuh-check-updates/public';
import { WazuhCorePluginStart } from '../../wazuh-core/public';
import { WazuhEnginePluginStart } from '../../wazuh-engine/public';
import { DashboardStart } from '../../../src/plugins/dashboard/public';
import { WazuhFleetPluginStart } from '../../wazuh-fleet/public';

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
  visualizations: VisualizationsStart;
  discover: DiscoverStart;
  charts: ChartsPluginStart;
  securityOss: SecurityOssPluginStart;
  savedObjects: SavedObjectsStart;
  telemetry: TelemetryPluginStart;
  wazuhCheckUpdates: WazuhCheckUpdatesPluginStart;
  wazuhCore: WazuhCorePluginStart;
  wazuhEngine: WazuhEnginePluginStart;
  dashboard: DashboardStart;
  wazuhFleet: WazuhFleetPluginStart;
}
export interface AppDependencies {
  core: CoreStart;
  plugins: AppPluginStartDependencies;
  params: AppMountParameters;
}

export type WazuhSetupPlugins = {
  uiActions: UiActionsSetup;
  visualizations: VisualizationsSetup;
  data: DataPublicPluginSetup;
  navigation: NavigationPublicPluginStart;
  telemetry: TelemetryPluginSetup;
};

export type WazuhStartPlugins = AppPluginStartDependencies;

export type WazuhSetup = {};
export type WazuhStart = {};

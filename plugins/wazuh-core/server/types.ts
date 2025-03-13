import { WazuhCoreServices } from './services';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginSetup extends WazuhCoreServices {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginStart extends WazuhCoreServices {}

export interface PluginSetup {
  securityDashboards?: object; // TODO: Add OpenSearch Dashboards Security interface
}

export * from './services/initialization/types';

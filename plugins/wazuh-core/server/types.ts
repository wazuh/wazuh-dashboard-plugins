import { AvailableUpdates } from '../common/types';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginStart {
  getUpdates: () => Promise<AvailableUpdates[]>;
  log: (location: string, message: string, level?: string) => void;
}

export type PluginSetup = {
  securityDashboards?: {}; // TODO: Add OpenSearch Dashboards Security interface
};

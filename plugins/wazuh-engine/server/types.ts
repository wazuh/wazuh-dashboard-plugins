import {
  WazuhCorePluginStart,
  WazuhCorePluginSetup,
} from '../../wazuh-core/server';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AppPluginStartDependencies {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhEnginePluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhEnginePluginStart {}

export type PluginSetup = {
  wazuhCore: WazuhCorePluginSetup;
};

export interface AppPluginStartDependencies {
  wazuhCore: WazuhCorePluginStart;
}

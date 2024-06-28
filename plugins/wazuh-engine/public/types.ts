import { WazuhCorePluginStart } from '../../wazuh-core/public';

export interface WazuhEnginePluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhEnginePluginStart {}

export interface AppPluginStartDependencies {
  wazuhCore: WazuhCorePluginStart;
}

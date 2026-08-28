import { WazuhCorePluginStart } from '../../wazuh-core/public';

export interface WazuhAiAssistantPluginSetup {}

export interface WazuhAiAssistantPluginStart {}

export interface WazuhAiAssistantPluginSetupDependencies {}

export interface WazuhAiAssistantPluginStartDependencies {
  wazuhCore: WazuhCorePluginStart;
}

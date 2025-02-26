import {
  WazuhCorePluginSetup,
  WazuhCorePluginStart,
} from '../../wazuh-core/public';

export interface AnalysisSetup {}

export interface AnalysisStart {}
export interface AnalysisSetupDependencies {
  wazuhCore: WazuhCorePluginSetup;
}

export interface AnalysisStartDependencies {
  wazuhCore: WazuhCorePluginStart;
}

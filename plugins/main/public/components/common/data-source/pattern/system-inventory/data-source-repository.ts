import {
  WAZUH_IT_HYGIENE_HARDWARE_PATTERN,
  WAZUH_IT_HYGIENE_HOTFIXES_PATTERN,
  WAZUH_IT_HYGIENE_INTERFACES_PATTERN,
  WAZUH_IT_HYGIENE_NETWORKS_PATTERN,
  WAZUH_IT_HYGIENE_PACKAGES_PATTERN,
  WAZUH_IT_HYGIENE_PATTERN,
  WAZUH_IT_HYGIENE_PORTS_PATTERN,
  WAZUH_IT_HYGIENE_PROCESSES_PATTERN,
  WAZUH_IT_HYGIENE_PROTOCOLS_PATTERN,
  WAZUH_IT_HYGIENE_SYSTEM_PATTERN,
} from '../../../../../../common/constants';
import { createPatternDataSourceRepositoryUseValue } from '../pattern-data-source-repository-use-setting-value';

export const SystemInventoryStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_IT_HYGIENE_PATTERN);

export const SystemInventoryNetworksStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_IT_HYGIENE_NETWORKS_PATTERN);

export const SystemInventoryInterfacesStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(
    WAZUH_IT_HYGIENE_INTERFACES_PATTERN,
  );

export const SystemInventoryProtocolsStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_IT_HYGIENE_PROTOCOLS_PATTERN);

export const SystemInventoryProcessesStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_IT_HYGIENE_PROCESSES_PATTERN);

export const SystemInventoryPortsStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_IT_HYGIENE_PORTS_PATTERN);

export const SystemInventoryPackagesStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_IT_HYGIENE_PACKAGES_PATTERN);

export const SystemInventoryHotfixesStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_IT_HYGIENE_HOTFIXES_PATTERN);

export const SystemInventorySystemStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_IT_HYGIENE_SYSTEM_PATTERN);

export const SystemInventoryHardwareStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_IT_HYGIENE_HARDWARE_PATTERN);

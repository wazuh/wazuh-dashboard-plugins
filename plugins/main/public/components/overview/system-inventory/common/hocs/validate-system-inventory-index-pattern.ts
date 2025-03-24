import {
  withIndexPatternFromSettingDataSource,
  withIndexPatternsFromSettingDataSource,
} from './validate-index-pattern';

export const withSystemInventoryDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory.pattern',
  });

export const withSystemInventoryHardwareDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_hardware.pattern',
  });

export const withSystemInventoryHotfixesDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_hotfixes.pattern',
  });

export const withSystemInventoryInterfacesDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_interfaces.pattern',
  });

export const withSystemInventoryPortsDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_ports.pattern',
  });

export const withSystemInventoryNetworksDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_networks.pattern',
  });

export const withSystemInventoryPackagesDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_packages.pattern',
  });

export const withSystemInventoryProcessesDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_processes.pattern',
  });

export const withSystemInventoryProtocolsDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_protocols.pattern',
  });

export const withSystemInventorySystemDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_systems.pattern',
  });

export const withSystemInventoryHardwareSystemDataSource =
  withIndexPatternsFromSettingDataSource({
    indexPatternSettings: [
      'system_inventory_hardware.pattern',
      'system_inventory_systems.pattern',
    ],
  });

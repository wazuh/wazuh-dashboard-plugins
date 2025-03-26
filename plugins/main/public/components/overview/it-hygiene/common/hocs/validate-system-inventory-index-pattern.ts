import { withIndexPatternFromSettingDataSource } from './validate-index-pattern';

export const withSystemInventoryDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory.pattern',
  });

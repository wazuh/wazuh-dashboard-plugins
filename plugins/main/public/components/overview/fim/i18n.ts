import { i18n } from '@osd/i18n';

const t = (id: string, defaultMessage: string) =>
  i18n.translate(`wazuh.fim.${id}`, { defaultMessage });

export const fimI18n = {
  inventory: t('inventory', 'Inventory'),
  indexPatternMissingTitle: t(
    'indexPatternMissingTitle',
    'File integrity monitoring could be disabled or has a problem',
  ),
  indexPatternMissingBody: t(
    'indexPatternMissingBody',
    'If this is enabled, then this could be caused by an error in: server side, server-indexer connection or indexer side. Review the server and indexer logs.',
  ),
  indexPatternMissingDocsIntro: t(
    'indexPatternMissingDocsIntro',
    'Also, you can check the',
  ),
  indexPatternMissingDocs: t(
    'indexPatternMissingDocs',
    'file integrity monitoring documentation.',
  ),
  refresh: t('refresh', 'Refresh'),
  tabFiles: t('tabFiles', 'Files'),
  tabRegistryKeys: t('tabRegistryKeys', 'Registry keys'),
  tabRegistryValues: t('tabRegistryValues', 'Registry values'),
  filterPath: t('filterPath', 'Path'),
  filterOwner: t('filterOwner', 'Owner'),
  filterGroup: t('filterGroup', 'Group'),
  filterValue: t('filterValue', 'Value'),
  filterDataType: t('filterDataType', 'Data type'),
  others: t('others', 'Others'),
  top5FilePaths: t('top5FilePaths', 'Top 5 file paths'),
  fileOwners: t('fileOwners', 'File owners'),
  fileOwnerCount: t('fileOwnerCount', 'File owner count'),
  fileOwner: t('fileOwner', 'File owner'),
  top5RegistryPaths: t('top5RegistryPaths', 'Top 5 registry paths'),
  registryOwners: t('registryOwners', 'Registry owners'),
  registryOwnerCount: t('registryOwnerCount', 'Registry owner count'),
  registryOwner: t('registryOwner', 'Registry owner'),
  registryGroups: t('registryGroups', 'Registry groups'),
  registryGroupsCount: t('registryGroupsCount', 'Registry groups count'),
  registryGroup: t('registryGroup', 'Registry group'),
  top5RegistryValues: t('top5RegistryValues', 'Top 5 registry values'),
  dataTypes: t('dataTypes', 'Data types'),
  registryDataTypeCount: t(
    'registryDataTypeCount',
    'Registry data type count',
  ),
  registryDataType: t('registryDataType', 'Registry data type'),
};

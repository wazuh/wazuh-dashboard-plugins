import { i18n } from '@osd/i18n';
import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
} from '../../../../../../services/visualizations';
import { buildDashboardKPIPanels } from '../../../../it-hygiene/common/create-dashboard-panels-kpis';

export const getDashboard = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateTable(
      indexPatternId,
      'registry.path',
      '',
      'registry-values-inventory',
      {
        size: 5,
        fieldCustomLabel: i18n.translate(
          'wazuh.fileIntegrityMonitoring.registryValuesDashboard.topRegistryPathsLabel',
          {
            defaultMessage: 'Top 5 registry paths',
          },
        ),
      },
    ),
    getVisStateTable(
      indexPatternId,
      'registry.value',
      '',
      'registry-values-inventory',
      {
        size: 5,
        fieldCustomLabel: i18n.translate(
          'wazuh.fileIntegrityMonitoring.registryValuesDashboard.topRegistryValuesLabel',
          {
            defaultMessage: 'Top 5 registry values',
          },
        ),
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'registry.data.type',
      i18n.translate(
        'wazuh.fileIntegrityMonitoring.registryValuesDashboard.dataTypesTitle',
        {
          defaultMessage: 'Data types',
        },
      ),
      'registry-values-inventory',
      {
        fieldSize: 4,
        otherBucket: i18n.translate(
          'wazuh.fileIntegrityMonitoring.registryValuesDashboard.othersBucketLabel',
          {
            defaultMessage: 'Others',
          },
        ),
        metricCustomLabel: i18n.translate(
          'wazuh.fileIntegrityMonitoring.registryValuesDashboard.registryDataTypeCountLabel',
          {
            defaultMessage: 'Registry data type count',
          },
        ),
        valueAxesTitleText: ' ',
        fieldCustomLabel: i18n.translate(
          'wazuh.fileIntegrityMonitoring.registryValuesDashboard.registryDataTypeLabel',
          {
            defaultMessage: 'Registry data type',
          },
        ),
        seriesLabel: i18n.translate(
          'wazuh.fileIntegrityMonitoring.registryValuesDashboard.registryDataTypeSeriesLabel',
          {
            defaultMessage: 'Registry data type',
          },
        ),
      },
    ),
  ]);
};

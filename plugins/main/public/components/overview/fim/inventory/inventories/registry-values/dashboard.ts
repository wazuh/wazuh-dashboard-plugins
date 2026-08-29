import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
} from '../../../../../../services/visualizations';
import { buildDashboardKPIPanels } from '../../../../it-hygiene/common/create-dashboard-panels-kpis';
import { fimI18n } from '../../../../i18n';

export const getDashboard = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateTable(
      indexPatternId,
      'registry.path',
      '',
      'registry-values-inventory',
      {
        size: 5,
        fieldCustomLabel: fimI18n.top5RegistryPaths,
      },
    ),
    getVisStateTable(
      indexPatternId,
      'registry.value',
      '',
      'registry-values-inventory',
      {
        size: 5,
        fieldCustomLabel: fimI18n.top5RegistryValues,
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'registry.data.type',
      fimI18n.dataTypes,
      'registry-values-inventory',
      {
        fieldSize: 4,
        otherBucket: fimI18n.others,
        metricCustomLabel: fimI18n.registryDataTypeCount,
        valueAxesTitleText: ' ',
        fieldCustomLabel: fimI18n.registryDataType,
        seriesLabel: fimI18n.registryDataType,
      },
    ),
  ]);
};

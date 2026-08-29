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
      'registry-keys-inventory',
      {
        size: 5,
        fieldCustomLabel: fimI18n.top5RegistryPaths,
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'registry.owner',
      fimI18n.registryOwners,
      'registry-keys-inventory',
      {
        fieldSize: 4,
        otherBucket: fimI18n.others,
        metricCustomLabel: fimI18n.registryOwnerCount,
        valueAxesTitleText: ' ',
        fieldCustomLabel: fimI18n.registryOwner,
        seriesLabel: fimI18n.registryOwner,
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'registry.group',
      fimI18n.registryGroups,
      'registry-keys-inventory',
      {
        fieldSize: 4,
        otherBucket: fimI18n.others,
        metricCustomLabel: fimI18n.registryGroupsCount,
        valueAxesTitleText: ' ',
        fieldCustomLabel: fimI18n.registryGroup,
        seriesLabel: fimI18n.registryGroup,
      },
    ),
  ]);
};

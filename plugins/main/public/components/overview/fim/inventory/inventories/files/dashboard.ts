import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
} from '../../../../../../services/visualizations';
import { buildDashboardKPIPanels } from '../../../../it-hygiene/common/create-dashboard-panels-kpis';
import { fimI18n } from '../../../../i18n';

export const getDashboard = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateTable(indexPatternId, 'file.path', '', 'fim-files-inventory', {
      size: 5,
      fieldCustomLabel: fimI18n.top5FilePaths,
    }),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'file.owner',
      fimI18n.fileOwners,
      'fim-files-inventory',
      {
        fieldSize: 4,
        otherBucket: fimI18n.others,
        metricCustomLabel: fimI18n.fileOwnerCount,
        valueAxesTitleText: ' ',
        seriesLabel: fimI18n.fileOwnerCount,
        fieldCustomLabel: fimI18n.fileOwner,
      },
    ),
  ]);
};

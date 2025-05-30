import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
} from '../../../../../../services/visualizations';
import { buildDashboardKPIPanels } from '../../../../it-hygiene/common/create-dashboard-panels-kpis';

export const getDashboard = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'file.owner',
      'Top 5 file owners',
      'fim-files-inventory',
      {
        fieldSize: 5,
        metricCustomLabel: 'File owner count',
        valueAxesTitleText: 'File owner count',
        seriesLabel: 'File owner count',
        fieldCustomLabel: 'File owner',
      },
    ),
    getVisStateTable(indexPatternId, 'file.path', '', 'fim-files-inventory', {
      size: 5,
      fieldCustomLabel: 'Top 5 file paths',
      excludeTerm: '.*wazuh.*' /* Exclude by values that contains "wazuh" */,
    }),
    // TODO: add another visualization, see https://github.com/wazuh/wazuh-dashboard-plugins/issues/7460#issuecomment-2912512333
  ]);
};

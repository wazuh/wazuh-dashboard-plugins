import type { DashboardByRendererPanels } from '../../../../../../../common/dashboards';
import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
} from '../../../../../../../common/dashboards/lib';
import { SCA_CHECK_RESULT_COLORS } from '../../../utils/constants';

const checkResultColors = SCA_CHECK_RESULT_COLORS;

export const getKPIsPanel = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return {
    '1': {
      gridData: { w: 24, h: 9, x: 0, y: 0, i: '1' },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateTable(
          indexPatternId,
          'policy.id',
          '',
          'sca-top-policies',
          {
            size: 5,
            fieldCustomLabel: 'Top 5 policies',
          },
        ),
      },
    },
    '2': {
      gridData: { w: 24, h: 9, x: 24, y: 0, i: '2' },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'check.result',
          'Checks by result',
          'sca-checks-by-result-inventory',
          {
            fieldSize: 4,
            metricCustomLabel: 'Check result count',
            valueAxesTitleText: ' ',
            seriesLabel: 'Check result count',
            fieldCustomLabel: 'Check result',
            uiState: {
              vis: {
                colors: checkResultColors,
              },
            },
          },
        ),
      },
    },
  };
};

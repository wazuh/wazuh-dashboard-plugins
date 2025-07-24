import { DashboardPanelState } from '../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../src/plugins/embeddable/public';
import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
} from '../../../../services/visualizations';

const checkResultColors = {
  passed: '#54b399',
  failed: '#cc5642',
  'Not run': '#6092c0',
};

export const getKPIsPanel = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
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
            fieldCustomLabel: 'Top Policies',
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
          'Check results by Check',
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

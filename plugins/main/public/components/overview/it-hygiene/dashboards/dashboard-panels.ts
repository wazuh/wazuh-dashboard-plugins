import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';
import { getVisStateHistogramBy, getVisStateHorizontalBarSplitSeries } from '../../../../../common/dashboards/lib';
import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
} from '../../../common/data-source';

const getOverviewDashboardPanels = (indexPatternId: string) => {
  return {
    '1': {
      gridData: {
        w: 16,
        h: 12,
        x: 0,
        y: 6,
        i: '1',
      },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'destination.port',
          'Top 5 destination ports',
          'it-hygiene-dashboard-top-destination-ports',
          {
            fieldSize: 5,
            metricCustomLabel: 'Top ports count',
            valueAxesTitleText: ' ',
            seriesLabel: 'Top ports',
            seriesMode: 'normal',
            fieldCustomLabel: 'Top ports',
            searchFilter: [
              PatternDataSourceFilterManager.createFilter(
                FILTER_OPERATOR.EXISTS,
                'destination.port',
                null,
                indexPatternId,
              ),
              PatternDataSourceFilterManager.createFilter(
                FILTER_OPERATOR.IS_NOT,
                'destination.port',
                0,
                indexPatternId,
              ),
            ],
          },
        ),
      },
    },
    '2': {
      gridData: {
        w: 16,
        h: 12,
        x: 16,
        y: 6,
        i: '2',
      },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'source.port',
          'Top 5 source ports',
          'it-hygiene-top-operating-system-names',
          {
            fieldSize: 5,
            metricCustomLabel: 'Top ports count',
            valueAxesTitleText: ' ',
            seriesLabel: 'Top ports',
            seriesMode: 'normal',
            fieldCustomLabel: 'Top ports',
          },
        ),
      },
    },
    '3': {
      gridData: {
        w: 16,
        h: 12,
        x: 32,
        y: 6,
        i: '3',
      },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getVisStateHistogramBy(
          indexPatternId,
          'process.start',
          'Processes start time',
          'it-hygiene-processes',
          'h',
          { addLegend: false, customLabel: ' ', valueAxesTitleText: '' },
        ),
      },
    },
  };
};

const getAgentDashboardPanels = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    a1: {
      gridData: {
        w: 16,
        h: 12,
        x: 0,
        y: 6,
        i: 'a1',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a1',
        savedVis: getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'destination.port',
          'Top 5 destination ports',
          'it-hygiene-dashboard-top-destination-ports-agent',
          {
            fieldSize: 5,
            metricCustomLabel: 'Top ports count',
            valueAxesTitleText: ' ',
            seriesLabel: 'Top ports',
            seriesMode: 'normal',
            fieldCustomLabel: 'Top ports',
            searchFilter: [
              PatternDataSourceFilterManager.createFilter(
                FILTER_OPERATOR.EXISTS,
                'destination.port',
                null,
                indexPatternId,
              ),
              PatternDataSourceFilterManager.createFilter(
                FILTER_OPERATOR.IS_NOT,
                'destination.port',
                0,
                indexPatternId,
              ),
            ],
          },
        ),
      },
    },
    a2: {
      gridData: {
        w: 16,
        h: 12,
        x: 16,
        y: 6,
        i: 'a2',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a2',
        savedVis: getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'source.port',
          'Top 5 source ports',
          'it-hygiene-top-operating-system-names',
          {
            fieldSize: 5,
            metricCustomLabel: 'Top ports count',
            valueAxesTitleText: ' ',
            seriesLabel: 'Top ports',
            seriesMode: 'normal',
            fieldCustomLabel: 'Top ports',
          },
        ),
      },
    },
    a3: {
      gridData: {
        w: 16,
        h: 12,
        x: 32,
        y: 6,
        i: 'a3',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a3',
        savedVis: getVisStateHistogramBy(
          indexPatternId,
          'process.start',
          'Processes start time',
          'it-hygiene-processes',
          'h',
          { addLegend: false, customLabel: ' ', valueAxesTitleText: '' },
        ),
      },
    },
  };
};

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return isPinnedAgent
    ? getAgentDashboardPanels(indexPatternId)
    : getOverviewDashboardPanels(indexPatternId);
};

import {
  getVisStateHistogramBy,
  getVisStateHorizontalBarSplitSeries,
} from '../../../../../lib';
import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../../lib/dashboard-config-service';
import {
  CompactDataSourceFilterManager,
  FILTER_OPERATOR,
} from '../../../../../lib/data-source/pattern/compact-data-source-filter-manager';

export class ITHygienePinnedAgentDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values({
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
                CompactDataSourceFilterManager.createFilter(
                  FILTER_OPERATOR.EXISTS,
                  'destination.port',
                  null,
                  indexPatternId,
                ),
                CompactDataSourceFilterManager.createFilter(
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
    }).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ITHygienePinnedAgentDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygienePinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-pinned-agent-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene - Pinned Agent';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene Pinned Agent';
  }
}

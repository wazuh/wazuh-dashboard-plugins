import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
  SCA_CHECK_RESULT_COLOR_MAPPING
} from '../../../../lib';
import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';

export class SCAInventoryDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values({
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
                  colors: SCA_CHECK_RESULT_COLOR_MAPPING,
                },
              },
            },
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

export class SCAInventoryDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new SCAInventoryDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'sca-inventory-dashboard';
  }

  protected override getTitle(): string {
    return 'Software Composition Analysis Inventory';
  }

  protected override getDescription(): string {
    return 'Dashboard for Software Composition Analysis (SCA) Inventory';
  }
}

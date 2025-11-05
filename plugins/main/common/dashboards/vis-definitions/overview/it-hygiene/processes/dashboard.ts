import {
  buildDashboardKPIPanels,
  getVisStateHistogramBy,
  getVisStateHorizontalBarByField,
} from '../../../../lib';
import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';

export class ITHygieneProcessesDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateHorizontalBarByField(
          indexPatternId,
          'process.name',
          'Top 5 processes',
          'it-hygiene-processes',
          { fieldCustomLabel: 'Processes' },
        ),
        getVisStateHistogramBy(
          indexPatternId,
          'process.start',
          'Processes start time',
          'it-hygiene-processes',
          'h',
          { addLegend: false, customLabel: ' ', valueAxesTitleText: '' },
        ),
      ]),
    ).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ITHygieneProcessesDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygieneProcessesDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-processes-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene - Processes';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene Processes';
  }
}

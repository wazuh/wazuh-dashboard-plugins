import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
  getVisStateMetricUniqueCountByField,
} from '../../../../lib';
import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';

export class ITHygieneServicesDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateHorizontalBarByField(
          indexPatternId,
          'service.name',
          'Top 5 services',
          'it-hygiene-services',
          {
            fieldCustomLabel: 'Services',
          },
        ),
        getVisStateMetricUniqueCountByField(
          indexPatternId,
          'service.name',
          '',
          'it-hygiene-services',
          'Unique services',
        ),
      ]),
    ).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ITHygieneServicesDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygieneServicesDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-services-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene - Services';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene Services';
  }
}

import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../../lib/dashboard-config-service';
import {
  getVisStateOfficeAlertsEvolutionByUserID,
  getVisStateOfficeCountryTagCloud,
  getVisStateTopOfficeUsers,
} from '../vis-states';

export class OfficeDrilldownOperationsDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 19,
          h: 14,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateTopOfficeUsers(indexPatternId),
      },
      {
        gridData: {
          w: 29,
          h: 14,
          x: 19,
          y: 0,
        },
        savedVis: getVisStateOfficeCountryTagCloud(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 11,
          x: 0,
          y: 14,
        },
        savedVis: getVisStateOfficeAlertsEvolutionByUserID(indexPatternId),
      },
    );
  }
}

export class OfficeDrilldownOperationsDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new OfficeDrilldownOperationsDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'office-drilldown-operations-config-panel-tab';
  }
  protected override getTitle(): string {
    return 'Office drilldown operations config dashboard';
  }
  protected override getDescription(): string {
    return 'Dashboard of the Office drilldown operations config';
  }
}

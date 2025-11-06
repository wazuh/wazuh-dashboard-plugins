import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../../lib/dashboard-config-service';
import {
  getVisStateOfficeAlertsEvolutionByUserID,
  getVisStateOfficeCountryTagCloud,
  getVisStateOfficeTopOperations,
  getVisStateTopOfficeUsers,
} from '../vis-states';

export class OfficeDrilldownRulesConfigDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 15,
          h: 14,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateOfficeTopOperations(indexPatternId),
      },
      {
        gridData: {
          w: 15,
          h: 14,
          x: 15,
          y: 0,
        },
        savedVis: getVisStateTopOfficeUsers(indexPatternId),
      },
      {
        gridData: {
          w: 18,
          h: 14,
          x: 30,
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

export class OfficeDrilldownRulesConfigDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new OfficeDrilldownRulesConfigDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'office-drilldown-rules-config-panel-tab';
  }
  protected override getTitle(): string {
    return 'Office drilldown rules config dashboard';
  }
  protected override getDescription(): string {
    return 'Dashboard of the Office drilldown rules config';
  }
}

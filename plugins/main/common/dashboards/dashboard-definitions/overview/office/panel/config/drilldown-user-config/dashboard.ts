import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../../../lib/dashboard-config-service';
import {
  getVisStateOfficeAlertsEvolutionByUser,
  getVisStateOfficeClientIPOperationLevelTable,
  getVisStateOfficeMetricStats,
  getVisStateOfficeTopsEventsPie,
} from '../vis-states';

export class OfficeDrilldownUserConfigDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 14,
          h: 14,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateOfficeMetricStats(indexPatternId),
      },
      {
        gridData: {
          w: 14,
          h: 14,
          x: 14,
          y: 0,
        },
        savedVis: getVisStateOfficeTopsEventsPie(indexPatternId),
      },
      {
        gridData: {
          w: 20,
          h: 14,
          x: 28,
          y: 0,
        },
        savedVis: getVisStateOfficeClientIPOperationLevelTable(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 11,
          x: 0,
          y: 14,
        },
        savedVis: getVisStateOfficeAlertsEvolutionByUser(indexPatternId),
      },
    );
  }
}

export class OfficeDrilldownUserConfigDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new OfficeDrilldownUserConfigDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'office-drilldown-user-config-panel-tab';
  }
  protected override getTitle(): string {
    return 'Office Drilldown User Config Dashboard';
  }
  protected override getDescription(): string {
    return 'Dashboard for Office drilldown user configuration';
  }
}

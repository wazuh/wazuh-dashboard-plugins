import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../../../lib/dashboard-config-service';
import {
  getVisStateOfficeAlertsEvolutionByUser,
  getVisStateOfficeMetricStats,
  getVisStateOfficeTopsEventsPie,
  getVisStateOfficeUserOperationLevel,
} from '../vis-states';

export class OfficeDrilldownIPConfigDashboardLayoutDefinition extends DashboardLayoutDefinition {
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
        savedVis: getVisStateOfficeMetricStats(indexPatternId),
      },
      {
        gridData: {
          w: 15,
          h: 14,
          x: 15,
          y: 0,
        },
        savedVis: getVisStateOfficeTopsEventsPie(indexPatternId),
      },
      {
        gridData: {
          w: 18,
          h: 14,
          x: 30,
          y: 0,
        },
        savedVis: getVisStateOfficeUserOperationLevel(indexPatternId),
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

export class OfficeDrilldownIPConfigDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new OfficeDrilldownIPConfigDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'office-drilldown-ip-config-panel-tab';
  }
  protected override getTitle(): string {
    return 'Office drilldown ip configuration dashboard';
  }
  protected override getDescription(): string {
    return 'Dashboard of the office drilldown ip config';
  }
}

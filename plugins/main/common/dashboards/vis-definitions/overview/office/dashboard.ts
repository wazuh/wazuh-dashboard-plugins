import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../lib/dashboard-builder';
import {
  getVisStateEventsBySeverity,
  getVisStateIPsByUser,
  getVisStateOfficeMap,
  getVisStateRuleDescription,
  getVisStateSeverityByUser,
  getVisStateTopUserBySubcription,
  getVisStateUsersByOperationResult,
} from './vis-states';

export abstract class OfficeDashboardLayoutDefinition extends DashboardLayoutDefinition {}

export class OfficeOverviewDashboardLayoutDefinition extends OfficeDashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 20,
          h: 11,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateEventsBySeverity(indexPatternId),
      },
      {
        gridData: {
          w: 14,
          h: 11,
          x: 20,
          y: 0,
        },
        savedVis: getVisStateIPsByUser(indexPatternId),
      },
      {
        gridData: {
          w: 14,
          h: 11,
          x: 34,
          y: 0,
        },
        savedVis: getVisStateTopUserBySubcription(indexPatternId),
      },
      {
        gridData: {
          w: 18,
          h: 11,
          x: 0,
          y: 11,
        },
        savedVis: getVisStateUsersByOperationResult(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 11,
          x: 18,
          y: 11,
        },
        savedVis: getVisStateSeverityByUser(indexPatternId),
      },
      {
        gridData: {
          w: 18,
          h: 11,
          x: 30,
          y: 11,
        },
        savedVis: getVisStateRuleDescription(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 22,
          x: 0,
          y: 22,
        },
        savedVis: getVisStateOfficeMap(indexPatternId),
      },
    );
  }
}

export abstract class OfficeDashboardByRendererConfig extends DashboardByRendererConfig {}

export class OfficeOverviewDashboardByRendererConfig extends OfficeDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new OfficeOverviewDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'office-overview-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'Office overview dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of Office overview';
  }
}

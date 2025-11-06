import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateDisplayName,
  getVisStateEventsByCategory,
  getVisStateGeolocationMap,
  getVisStateOperationsTypes,
  getVisStateRegions,
  getVisStateResults
} from '../vis-states';

export class AzureOverviewDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 12,
          h: 9,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateResults(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 9,
          x: 12,
          y: 0,
        },
        savedVis: getVisStateRegions(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 9,
          x: 24,
          y: 0,
        },
        savedVis: getVisStateDisplayName(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 12,
          x: 0,
          y: 9,
        },
        savedVis: getVisStateEventsByCategory(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 12,
          x: 24,
          y: 9,
        },
        savedVis: getVisStateOperationsTypes(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 20,
          x: 0,
          y: 21,
        },
        savedVis: getVisStateGeolocationMap(indexPatternId),
      },
    );
  }
}

export class AzureOverviewDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new AzureOverviewDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'azure-overview-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'Azure Overview Dashboard';
  }
  protected override getDescription(): string {
    return 'Overview dashboard for Azure';
  }
}

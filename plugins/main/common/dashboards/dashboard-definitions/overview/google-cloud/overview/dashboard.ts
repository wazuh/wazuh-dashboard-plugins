import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateEventsOverTime,
  getVisStateTop5Map,
  getVisStateTopProjectIdBySource,
  getVisStateTopResourceTypeProject,
  getVisStateTopResponseCode,
} from '../vis-states';

export class GoogleCloudOverviewDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 48,
          h: 9,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateEventsOverTime(indexPatternId),
      },
      {
        gridData: {
          w: 13,
          h: 9,
          x: 0,
          y: 9,
        },
        savedVis: getVisStateTopResponseCode(indexPatternId),
      },
      {
        gridData: {
          w: 22,
          h: 9,
          x: 13,
          y: 9,
        },
        savedVis: getVisStateTopResourceTypeProject(indexPatternId),
      },
      {
        gridData: {
          w: 13,
          h: 9,
          x: 35,
          y: 9,
        },
        savedVis: getVisStateTopProjectIdBySource(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 15,
          x: 0,
          y: 18,
        },
        savedVis: getVisStateTop5Map(indexPatternId),
      },
    );
  }
}

export class GoogleCloudOverviewDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new GoogleCloudOverviewDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'google-cloud-detector-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'Google Cloud Overview Dashboard';
  }

  protected override getDescription(): string {
    return 'Google Cloud overview dashboard';
  }
}

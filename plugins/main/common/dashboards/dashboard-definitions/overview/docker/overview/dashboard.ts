import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateAgentEvents,
  getVisStateAgentResourcesUsageByOverTime,
  getVisStateAgentTop5Events,
  getVisStateAgentTop5Images,
  getVisStateEvents,
  getVisStateEventsSourceByOverTime,
  getVisStateTop5Events,
  getVisStateTop5Images,
} from '../vis-states';

export class DockerOverviewDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 16,
          h: 10,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateTop5Images(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 10,
          x: 16,
          y: 0,
        },
        savedVis: getVisStateTop5Events(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 10,
          x: 32,
          y: 0,
        },
        savedVis: getVisStateEventsSourceByOverTime(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 18,
          x: 0,
          y: 10,
        },
        savedVis: getVisStateEvents(indexPatternId),
      },
    );
  }
}

export class DockerOverviewDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new DockerOverviewDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'docker-overview-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'Docker Overview dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of Docker Overview';
  }
}

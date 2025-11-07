import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateAgentEvents,
  getVisStateAgentResourcesUsageByOverTime,
  getVisStateAgentTop5Events,
  getVisStateAgentTop5Images,
} from '../vis-states';

export class DockerPinnedAgentDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 12,
          h: 10,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateAgentTop5Images(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 10,
          x: 12,
          y: 0,
        },
        savedVis: getVisStateAgentTop5Events(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 10,
          x: 24,
          y: 0,
        },
        savedVis: getVisStateAgentResourcesUsageByOverTime(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 10,
          x: 0,
          y: 10,
        },
        savedVis: getVisStateAgentEvents(indexPatternId),
      },
    );
  }
}

export class DockerPinnedAgentDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new DockerPinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'docker-pinned-agent-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'Docker Agent Pinned dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of Docker Agent Pinned';
  }
}

import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateGCPAlerts,
  getVisStateGCPAuthAnswer,
  getVisStateTop5Instances,
  getVisStateTop5Rules,
  getVisStateTopProjectIdBySource,
  getVisStateTopQueryEvents,
  getVisStateTopResourceTypeProject
} from '../vis-states';

export class GoogleCloudPinnedAgentDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 24,
          h: 10,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateTop5Rules(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 10,
          x: 24,
          y: 0,
        },
        savedVis: getVisStateTopQueryEvents(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 10,
          x: 36,
          y: 0,
        },
        savedVis: getVisStateTop5Instances(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 11,
          x: 0,
          y: 10,
        },
        savedVis: getVisStateTopProjectIdBySource(indexPatternId),
      },
      {
        gridData: {
          w: 36,
          h: 11,
          x: 12,
          y: 18,
        },
        savedVis: getVisStateGCPAlerts(indexPatternId),
      },
      {
        gridData: {
          w: 20,
          h: 11,
          x: 0,
          y: 21,
        },
        savedVis: getVisStateGCPAuthAnswer(indexPatternId),
      },
      {
        gridData: {
          w: 28,
          h: 11,
          x: 20,
          y: 21,
        },
        savedVis: getVisStateTopResourceTypeProject(indexPatternId),
      },
    );
  }
}

export class GoogleCloudPinnedAgentDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new GoogleCloudPinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'google-cloud-pinned-agent-dashboard';
  }

  protected override getTitle(): string {
    return 'Google Cloud Agent Pinned Dashboard';
  }

  protected override getDescription(): string {
    return 'Google Cloud agent pinned dashboard';
  }
}

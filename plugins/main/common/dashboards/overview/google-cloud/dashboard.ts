import {
  DashboardByRendererConfig,
  DashboardLayoutConfig,
} from '../../dashboard-builder';
import {
  getVisStateEventsOverTime,
  getVisStateGCPAlerts,
  getVisStateGCPAuthAnswer,
  getVisStateTop5Instances,
  getVisStateTop5Map,
  getVisStateTop5Rules,
  getVisStateTopProjectIdBySource,
  getVisStateTopQueryEvents,
  getVisStateTopResourceTypeProject,
  getVisStateTopResponseCode,
} from './vis-states';

export abstract class GoogleCloudDashboardLayoutConfig extends DashboardLayoutConfig {}

export class GoogleCloudOverviewDashboardLayoutConfig extends GoogleCloudDashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super();
    this.gridVisualizationItems.push(
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

export class GoogleCloudPinnedAgentDashboardLayoutConfig extends GoogleCloudDashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super();
    this.gridVisualizationItems.push(
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

export abstract class GoogleCloudDashboardByRendererConfig extends DashboardByRendererConfig {}

export class GoogleCloudOverviewDashboardByRendererConfig extends GoogleCloudDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new GoogleCloudOverviewDashboardLayoutConfig(indexPatternId),
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

export class GoogleCloudPinnedAgentDashboardByRendererConfig extends GoogleCloudDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new GoogleCloudPinnedAgentDashboardLayoutConfig(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'google-cloud-agent-pinned-dashboard';
  }

  protected override getTitle(): string {
    return 'Google Cloud Agent Pinned Dashboard';
  }

  protected override getDescription(): string {
    return 'Google Cloud agent pinned dashboard';
  }
}

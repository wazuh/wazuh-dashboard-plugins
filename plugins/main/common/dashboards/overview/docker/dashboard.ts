import { DashboardByRendererConfig, DashboardLayoutConfig } from '../../dashboard-builder';
import {
  getVisStateAgentEvents,
  getVisStateAgentResourcesUsageByOverTime,
  getVisStateAgentTop5Events,
  getVisStateAgentTop5Images,
  getVisStateEvents,
  getVisStateEventsSourceByOverTime,
  getVisStateTop5Events,
  getVisStateTop5Images,
} from './vis-states';

export abstract class DockerDashboardLayoutConfig extends DashboardLayoutConfig {}

export class DockerOverviewDashboardLayoutConfig extends DockerDashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super();
    this.gridVisualizationItems.push(
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

export class DockerAgentPinnedDashboardLayoutConfig extends DockerDashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super();
    this.gridVisualizationItems.push(
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

export abstract class DockerDashboardByRendererConfig extends DashboardByRendererConfig {

  protected override get useMargins(): boolean {
    return true;
  }

  protected override get hidePanelTitles(): boolean {
    return false;
  }
}

export class DockerOverviewDashboardByRendererConfig extends DockerDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(indexPatternId, new DockerOverviewDashboardLayoutConfig(indexPatternId));
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

export class DockerAgentPinnedDashboardByRendererConfig extends DockerDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(indexPatternId, new DockerAgentPinnedDashboardLayoutConfig(indexPatternId));
  }

  protected override getId(): string {
    return 'docker-agent-pinned-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'Docker Agent Pinned dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of Docker Agent Pinned';
  }
}

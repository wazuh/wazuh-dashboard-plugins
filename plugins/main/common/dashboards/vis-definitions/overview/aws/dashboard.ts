import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../lib/dashboard-builder';
import {
  getVisStateAgentEventsByBucket,
  getVisStateAgentEventsBySource,
  getVisStateAgentGeolocationMap,
  getVisStateAgentRegions,
  getVisStateAgentTopAccounts,
  getVisStateAgentTopBuckets,
  getVisStateAgentTopSources,
  getVisStateEventsByBucket,
  getVisStateEventsBySource,
  getVisStateGeolocationMap,
  getVisStateRegions,
  getVisStateTopAccounts,
  getVisStateTopBuckets,
  getVisStateTopSources,
} from './vis-states';

export class AWSDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor() {
    super();
  }
}

export class AWSOverviewDashboardLayoutDefinition extends AWSDashboardLayoutDefinition {
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
        savedVis: getVisStateTopSources(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 9,
          x: 12,
          y: 0,
        },
        savedVis: getVisStateTopAccounts(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 9,
          x: 24,
          y: 0,
        },
        savedVis: getVisStateTopBuckets(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 9,
          x: 36,
          y: 0,
        },
        savedVis: getVisStateRegions(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 12,
          x: 0,
          y: 9,
        },
        savedVis: getVisStateEventsBySource(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 12,
          x: 24,
          y: 9,
        },
        savedVis: getVisStateEventsByBucket(indexPatternId),
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

export class AWSPinnedAgentDashboardLayoutDefinition extends AWSDashboardLayoutDefinition {
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
        savedVis: getVisStateAgentTopSources(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 9,
          x: 12,
          y: 0,
        },
        savedVis: getVisStateAgentTopAccounts(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 9,
          x: 24,
          y: 0,
        },
        savedVis: getVisStateAgentTopBuckets(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 9,
          x: 36,
          y: 0,
        },
        savedVis: getVisStateAgentRegions(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 12,
          x: 0,
          y: 9,
        },
        savedVis: getVisStateAgentEventsBySource(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 12,
          x: 24,
          y: 9,
        },
        savedVis: getVisStateAgentEventsByBucket(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 20,
          x: 0,
          y: 21,
        },
        savedVis: getVisStateAgentGeolocationMap(indexPatternId),
      },
    );
  }
}

export abstract class AWSDashboardByRendererConfig extends DashboardByRendererConfig {}

export class AWSOverviewDashboardByRendererConfig extends AWSDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(indexPatternId, new AWSOverviewDashboardLayoutDefinition(indexPatternId));
  }

  protected override getId(): string {
    return 'aws-overview-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'AWS overview dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the AWS overview';
  }
}

export class AWSPinnedAgentDashboardByRendererConfig extends AWSDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new AWSPinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'aws-agent-pinned-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'AWS Agent Pinned overview dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the AWS Agent Pinned overview';
  }
}

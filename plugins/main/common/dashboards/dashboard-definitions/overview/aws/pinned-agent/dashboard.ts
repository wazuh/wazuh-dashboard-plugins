import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateAgentEventsByBucket,
  getVisStateAgentEventsBySource,
  getVisStateAgentGeolocationMap,
  getVisStateAgentRegions,
  getVisStateAgentTopAccounts,
  getVisStateAgentTopBuckets,
  getVisStateAgentTopSources
} from '../vis-states';

export class AWSPinnedAgentDashboardLayoutDefinition extends DashboardLayoutDefinition {
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

export class AWSPinnedAgentDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new AWSPinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'aws-pinned-agent-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'AWS Agent Pinned overview dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the AWS Agent Pinned overview';
  }
}

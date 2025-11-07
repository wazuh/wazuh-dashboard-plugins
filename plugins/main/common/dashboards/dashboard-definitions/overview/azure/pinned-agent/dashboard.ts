import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateAgentDisplayName,
  getVisStateAgentEventsByCategory,
  getVisStateAgentGeolocationMap,
  getVisStateAgentOperationsTypes,
  getVisStateAgentRegions,
  getVisStateAgentResults
} from '../vis-states';

export class AzurePinnedAgentDashboardLayoutDefinition extends DashboardLayoutDefinition {
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
        savedVis: getVisStateAgentResults(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 9,
          x: 12,
          y: 0,
        },
        savedVis: getVisStateAgentRegions(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 9,
          x: 24,
          y: 0,
        },
        savedVis: getVisStateAgentDisplayName(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 12,
          x: 0,
          y: 9,
        },
        savedVis: getVisStateAgentEventsByCategory(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 12,
          x: 24,
          y: 9,
        },
        savedVis: getVisStateAgentOperationsTypes(indexPatternId),
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

export class AzurePinnedAgentDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new AzurePinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'azure-pinned-agent-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'Azure Agent Pinned dashboard';
  }
  protected override getDescription(): string {
    return 'Dashboard of the Azure Agent Pinned overview';
  }
}

import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../dashboard-builder';
import {
  getVisStateAgentDisplayName,
  getVisStateAgentEventsByCategory,
  getVisStateAgentGeolocationMap,
  getVisStateAgentOperationsTypes,
  getVisStateAgentRegions,
  getVisStateAgentResults,
  getVisStateDisplayName,
  getVisStateEventsByCategory,
  getVisStateGeolocationMap,
  getVisStateOperationsTypes,
  getVisStateRegions,
  getVisStateResults,
} from './vis-states';

export abstract class AzureDashboardLayoutDefinition extends DashboardLayoutDefinition {}

export class AzureOverviewDashboardLayoutDefinition extends AzureDashboardLayoutDefinition {
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

export class AzurePinnedAgentDashboardLayoutDefinition extends AzureDashboardLayoutDefinition {
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

export abstract class AzureDashboardByRendererConfig extends DashboardByRendererConfig {
  protected override getClassName(): string {
    return 'wz-dashboard-hide-tables-pagination-export-csv-controls';
  }
}

export class AzureOverviewDashboardByRendererConfig extends AzureDashboardByRendererConfig {
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

export class AzurePinnedAgentDashboardByRendererConfig extends AzureDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new AzurePinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'azure-agent-pinned-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'Azure Agent Pinned dashboard';
  }
  protected override getDescription(): string {
    return 'Dashboard of the Azure Agent Pinned overview';
  }
}

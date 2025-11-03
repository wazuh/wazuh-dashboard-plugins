import {
  DashboardByRendererConfig,
  DashboardLayoutConfig,
} from '../../dashboard-builder';
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

export abstract class AzureDashboardLayoutConfig extends DashboardLayoutConfig {}

export class AzureOverviewDashboardLayoutConfig extends AzureDashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super();
    this.gridVisualizationItems.push(
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

export class AzureAgentPinnedDashboardLayoutConfig extends AzureDashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super();
    this.gridVisualizationItems.push(
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

  protected override get useMargins(): boolean {
    return true;
  }
  protected override get hidePanelTitles(): boolean {
    return false;
  }

  protected override getClassName(): string {
    return 'wz-dashboard-hide-tables-pagination-export-csv-controls';
  }
}

export class AzureOverviewDashboardByRendererConfig extends AzureDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new AzureOverviewDashboardLayoutConfig(indexPatternId),
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

export class AzureAgentPinnedDashboardByRendererConfig extends AzureDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new AzureAgentPinnedDashboardLayoutConfig(indexPatternId),
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

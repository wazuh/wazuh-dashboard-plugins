import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateEventsDecodedSummary,
  getVisStateEventsDroppedByNode,
  getVisStateEventsProcessedByNode,
  getVisStateHostInfo,
  getVisStateQueueUsage,
  getVisStateRootcheck,
  getVisStateSCA,
  getVisStateSyscheck,
  getVisStateSyscollector,
} from './vis-states';

export class ServerManagementStatisticsDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 48,
          h: 13,
          x: 0,
          y: 13,
        },
        savedVis: getVisStateQueueUsage(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 13,
          x: 0,
          y: 26,
        },
        savedVis: getVisStateEventsDecodedSummary(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 13,
          x: 0,
          y: 39,
        },
        savedVis: getVisStateSyscheck(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 13,
          x: 24,
          y: 39,
        },
        savedVis: getVisStateSyscollector(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 13,
          x: 0,
          y: 52,
        },
        savedVis: getVisStateRootcheck(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 13,
          x: 24,
          y: 52,
        },
        savedVis: getVisStateSCA(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 13,
          x: 0,
          y: 65,
        },
        savedVis: getVisStateHostInfo(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 13,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateEventsProcessedByNode(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 13,
          x: 24,
          y: 0,
        },
        savedVis: getVisStateEventsDroppedByNode(indexPatternId),
      },
    );
  }
}

export class ServerManagementStatisticsDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ServerManagementStatisticsDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'server-management-statistics-dashboard';
  }
  protected override getTitle(): string {
    return 'Server Management Statistics Dashboard';
  }
  protected override getDescription(): string {
    return 'Dashboard for Server Management Statistics';
  }
}

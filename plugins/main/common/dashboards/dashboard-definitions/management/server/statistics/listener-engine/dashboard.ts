import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../../lib/dashboard-config-service';
import {
  getVisStateEventsSentToAnalysisd,
  getVisStateTCPSessions,
  getVisStateTotalNumberOfBytesReceived,
} from './vis-states';

export class ServerManagementStatisticsCommsDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values({
      '1': {
        gridData: {
          w: 24,
          h: 13,
          x: 0,
          y: 0,
          i: '1',
        },
        type: 'visualization',
        explicitInput: {
          id: '1',
          savedVis: getVisStateTotalNumberOfBytesReceived(indexPatternId),
        },
      },
      '2': {
        gridData: {
          w: 24,
          h: 13,
          x: 24,
          y: 0,
          i: '2',
        },
        type: 'visualization',
        explicitInput: {
          id: '2',
          savedVis: getVisStateEventsSentToAnalysisd(indexPatternId),
        },
      },
      '3': {
        gridData: {
          w: 48,
          h: 13,
          x: 0,
          y: 13,
          i: '3',
        },
        type: 'visualization',
        explicitInput: {
          id: '3',
          savedVis: getVisStateTCPSessions(indexPatternId),
        },
      },
    }).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ServerManagementStatisticsCommsDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ServerManagementStatisticsCommsDashboardLayoutDefinition(
        indexPatternId,
      ),
    );
  }

  protected override getId(): string {
    return 'server-management-statistics-comms-dashboard';
  }
  protected override getTitle(): string {
    return 'Server Management Statistics Comms Dashboard';
  }
  protected override getDescription(): string {
    return 'Dashboard for Server Management Statistics Comms';
  }
}

import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../../lib/dashboard-config-service';
import { getVisStateEventsSentToAnalysisd, getVisStateTCPSessions, getVisStateTotalNumberOfBytesReceived } from "./vis-states";

export class ServerManagementStatisticsListenerEngineDashboardLayoutDefinition extends DashboardLayoutDefinition {
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

export class ServerManagementStatisticsListenerEngineDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ServerManagementStatisticsListenerEngineDashboardLayoutDefinition(
        indexPatternId,
      ),
    );
  }

  protected override getId(): string {
    return 'server-management-statistics-listener-engine-dashboard';
  }
  protected override getTitle(): string {
    return 'Server Management Statistics Listener Engine Dashboard';
  }
  protected override getDescription(): string {
    return 'Dashboard for Server Management Statistics Listener Engine';
  }
}

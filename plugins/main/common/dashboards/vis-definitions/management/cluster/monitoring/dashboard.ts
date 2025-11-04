import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-builder';
import {
  getVisStateAlertsByNodeSummary,
  getVisStateClusterAlertsSummary,
} from './vis-states';

export class ClusterMonitoringDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(
    indexPatternId: string,
    {
      indexPatternTitle,
      nodeList,
      clusterName,
    }: {
      indexPatternTitle: string;
      nodeList: any[];
      clusterName?: string;
    },
  ) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: { w: 24, h: 13, x: 0, y: 0 },
        savedVis: getVisStateClusterAlertsSummary(
          {
            id: indexPatternId,
            title: indexPatternTitle,
          },
          clusterName,
        ),
      },
      {
        gridData: { w: 24, h: 13, x: 24, y: 0 },
        savedVis: getVisStateAlertsByNodeSummary(
          {
            id: indexPatternId,
            title: indexPatternTitle,
          },
          nodeList,
          clusterName,
        ),
      },
    );
  }
}

export class ClusterMonitoringDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(
    indexPatternId: string,
    {
      indexPatternTitle,
      nodeList,
      clusterName,
    }: {
      indexPatternTitle: string;
      nodeList: any[];
      clusterName?: string;
    },
  ) {
    super(
      indexPatternId,
      new ClusterMonitoringDashboardLayoutDefinition(indexPatternId, {
        indexPatternTitle,
        nodeList,
        clusterName,
      }),
    );
  }

  protected override getId(): string {
    return 'cluster-monitoring-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'Cluster Timelions dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the Cluster Timelions';
  }
}

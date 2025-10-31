import {
  DashboardByRendererConfig,
  DashboardLayoutConfig,
} from '../../../dashboard-builder';

const getVisStateClusterAlertsSummary = (
  indexPattern: { id: string; title: string },
  clusterName?: string,
) => {
  let expression = `.es(index=${indexPattern.title},q="cluster.name: ${clusterName}").label("${clusterName} cluster")`;
  expression = expression.replace(/'/g, '"');
  return {
    id: 'Wazuh-App-Cluster-monitoring-Overview-Manager',
    title: 'Cluster alerts summary',
    type: 'timelion',
    params: { expression, interval: 'auto' },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPattern.id,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPattern.id,
        },
      ],
      aggs: [],
    },
  };
};

const getVisStateAlertsByNodeSummary = (
  indexPattern: { id: string; title: string },
  nodeList: any[],
  clusterName?: string,
) => {
  let expression = '';
  for (const node of nodeList) {
    expression += `.es(index=${indexPattern.title},q="cluster.name: ${clusterName} AND cluster.node: ${node.name}").label("${node.name}"),`;
  }
  expression = expression.substring(0, expression.length - 1);
  expression = expression.replace(/'/g, '"');
  return {
    id: 'Wazuh-App-Cluster-monitoring-Overview',
    title: 'Alerts by node summary',
    type: 'timelion',
    params: { expression, interval: 'auto' },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPattern.id,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPattern.id,
        },
      ],
      aggs: [],
    },
  };
};

export class ClusterMonitoringDashboardLayoutConfig extends DashboardLayoutConfig {
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
    this.gridVisualizationItems = [
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
    ];
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
      new ClusterMonitoringDashboardLayoutConfig(indexPatternId, {
        indexPatternTitle,
        nodeList,
        clusterName,
      }),
    );
  }

  protected override getId(): string {
    return 'ct-dashboard-monitoring-tab';
  }

  protected override getTitle(): string {
    return 'Cluster Timelions dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the Cluster Timelions';
  }

  protected override get useMargins(): boolean {
    return true;
  }

  protected override get hidePanelTitles(): boolean {
    return false;
  }
}

import {
  DashboardByRendererConfig,
  DashboardLayoutConfig,
} from '../../dashboard-builder';
import type { DashboardByValueSavedVis, GridVisualPair } from '../../types';

const getVisStateTop5Nodes = (
  indexPatternId: string,
): DashboardByValueSavedVis => {
  return {
    id: 'Wazuh-App-Cluster-monitoring-Overview-Node-Pie',
    title: 'Top 5 nodes',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
      labels: { show: false, values: true, last_level: true, truncate: 100 },
    },
    uiState: { spy: { mode: { name: 'table' } } },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
      aggs: [
        { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'cluster.node',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            size: 5,
            order: 'desc',
            orderBy: '1',
          },
        },
      ],
    },
  };
};

export class ClusterConfigurationDashboardLayoutConfig extends DashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super(indexPatternId);
    this.savedVisualizations.push(getVisStateTop5Nodes);
  }

  generateGridDataWithVisualization(): GridVisualPair[] {
    return [
      {
        gridData: {
          w: 48,
          h: 13,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateTop5Nodes,
      },
    ];
  }
}

export class ClusterConfigurationDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ClusterConfigurationDashboardLayoutConfig(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'ct-dashboard-configuration-tab';
  }

  protected override getTitle(): string {
    return 'Cluster configuration dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the Cluster configuration';
  }

  protected override get useMargins(): boolean {
    return true;
  }

  protected override get hidePanelTitles(): boolean {
    return false;
  }
}

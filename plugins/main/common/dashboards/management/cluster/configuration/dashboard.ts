import {
  DashboardByRendererConfig,
  DashboardLayoutConfig,
} from '../../../dashboard-builder';
import { getVisStateTop5Nodes } from "./vis-states";

export class ClusterConfigurationDashboardLayoutConfig extends DashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super();
    this.gridVisualizationItems.push({
      gridData: { w: 48, h: 13, x: 0, y: 0 },
      savedVis: getVisStateTop5Nodes(indexPatternId),
    });
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
    return 'cluster-configuration-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'Cluster configuration dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the Cluster configuration';
  }
}

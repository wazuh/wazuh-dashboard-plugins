import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../lib/dashboard-builder';
import { getVisStateHitsHistogram } from './vis-states';

export class WazuhDiscoverDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs({
      gridData: { w: 100, h: 10, x: 0, y: 0 },
      savedVis: getVisStateHitsHistogram(indexPatternId),
    });
  }
}

export class WazuhDiscoverDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new WazuhDiscoverDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'wz-discover-events-histogram';
  }
  protected override getTitle(): string {
    return 'Wazuh Discover Events Histogram';
  }
  protected override getDescription(): string {
    return 'Histogram of Wazuh events by date';
  }
}

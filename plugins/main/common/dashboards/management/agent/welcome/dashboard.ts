import {
  DashboardByRendererConfig,
  DashboardLayoutConfig,
} from '../../../dashboard-builder';
import { getVisStateEventsCountEvolution } from './vis-states';

export class AgentsEventsDashboardLayoutConfig extends DashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs({
      gridData: { w: 48, h: 7, x: 0, y: 0 },
      savedVis: getVisStateEventsCountEvolution(indexPatternId),
    });
  }
}

export class AgentsEventsDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new AgentsEventsDashboardLayoutConfig(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'agent-events-count-evolution';
  }
  protected override getTitle(): string {
    return 'Events count evolution';
  }
  protected override getDescription(): string {
    return 'Dashboard of Events count evolution';
  }
  protected override get hidePanelTitles(): boolean {
    return true;
  }
}

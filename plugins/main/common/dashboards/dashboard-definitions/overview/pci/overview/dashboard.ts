import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateRequirementsByAgent,
  getVisStateRequirementsHeatmap,
  getVisStateTopAgentsByCount,
  getVisStateTopRequirements,
} from '../vis-states';

export class PCIOverviewDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 24,
          h: 14,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateTopRequirements(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 14,
          x: 24,
          y: 0,
        },
        savedVis: getVisStateTopAgentsByCount(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 19,
          x: 0,
          y: 14,
        },
        savedVis: getVisStateRequirementsHeatmap(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 9,
          x: 0,
          y: 33,
        },
        savedVis: getVisStateRequirementsByAgent(indexPatternId),
      },
    );
  }
}

export class PCIOverviewDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new PCIOverviewDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'pci-overview-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'PCI overview dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the PCI overview';
  }
}

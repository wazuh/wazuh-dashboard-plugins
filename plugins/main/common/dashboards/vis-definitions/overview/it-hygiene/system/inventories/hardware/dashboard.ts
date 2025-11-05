import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
} from '../../../../../../lib';
import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../../../lib/dashboard-config-service';
import type { DashboardByRendererPanels } from '../../../../../../types';
import { getVisStateHostsTotalFreeMemoryTable } from '../../../vis-states';

export class ITHygieneSystemInventoriesHardwareDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateHorizontalBarByField(
          indexPatternId,
          'host.cpu.name',
          'Top 5 CPU names',
          'it-hygiene-hardware',
          { fieldCustomLabel: 'CPUs' },
        ),
        getVisStateHorizontalBarByField(
          indexPatternId,
          'host.cpu.cores',
          'Top 5 CPU cores',
          'it-hygiene-hardware',
          { fieldCustomLabel: 'Cores count' },
        ),
        getVisStateHostsTotalFreeMemoryTable(
          indexPatternId,
          'host.memory.total',
          '',
          'it-hygiene-stat',
          { customLabel: 'Hosts total memory' },
        ),
      ]),
    ).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ITHygieneSystemInventoriesHardwareDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygieneSystemInventoriesHardwareDashboardLayoutDefinition(
        indexPatternId,
      ),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-system-inventories-hardware-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene - System Inventories - Hardware';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene System Inventories - Hardware';
  }
}

export class ITHygieneSystemInventoriesHardwareDashboardPanelsService {
  private static getOverviewDashboardPanels = (
    indexPatternId: string,
  ): DashboardByRendererPanels => {
    return new ITHygieneSystemInventoriesHardwareDashboardByRendererConfig(
      indexPatternId,
    ).getDashboardPanels();
  };

  public static getDashboardPanels(
    indexPatternId: string,
  ): DashboardByRendererPanels {
    return this.getOverviewDashboardPanels(indexPatternId);
  }
}

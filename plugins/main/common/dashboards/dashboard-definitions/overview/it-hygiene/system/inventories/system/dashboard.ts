import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
  getVisStateHorizontalBarSplitSeries,
} from '../../../../../../lib';
import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../../../lib/dashboard-config-service';
import type { DashboardByRendererPanels } from '../../../../../../types';

export class ITHygieneSystemInventoriesSystemDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateHorizontalBarByField(
          indexPatternId,
          'host.os.platform',
          'Top 5 platforms',
          'it-hygiene-system',
          { fieldCustomLabel: 'Platforms' },
        ),
        getVisStateHorizontalBarByField(
          indexPatternId,
          'host.os.name',
          'Top 5 operating systems',
          'it-hygiene-system',
          { fieldCustomLabel: 'OS' },
        ),
        getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'host.architecture',
          'Architecture',
          'it-hygiene-system',
          {
            fieldSize: 4,
            otherBucket: 'Others',
            metricCustomLabel: 'Host architecture count',
            valueAxesTitleText: ' ',
            fieldCustomLabel: 'Host architecture',
            seriesLabel: 'Host architecture',
          },
        ),
      ]),
    ).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ITHygieneSystemInventoriesSystemDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygieneSystemInventoriesSystemDashboardLayoutDefinition(
        indexPatternId,
      ),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-system-inventories-system-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene - System Inventories - System';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene System Inventories - System';
  }
}

export class ITHygieneSystemInventoriesSystemDashboardPanelsService {
  private static getOverviewDashboardPanels = (
    indexPatternId: string,
  ): DashboardByRendererPanels => {
    return new ITHygieneSystemInventoriesSystemDashboardConfig(
      indexPatternId,
    ).getDashboardPanels();
  };

  public static getDashboardPanels(
    indexPatternId: string,
  ): DashboardByRendererPanels {
    return this.getOverviewDashboardPanels(indexPatternId);
  }
}

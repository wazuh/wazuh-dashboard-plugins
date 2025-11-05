import { getVisStateTable } from '../../../../lib';
import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import type { DashboardByRendererPanels } from '../../../../types';

export class ITHygieneTablesDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values({
      t1: {
        gridData: {
          w: 12,
          h: 12,
          x: 0,
          y: 0,
          i: 't1',
        },
        type: 'visualization',
        explicitInput: {
          id: 't1',
          savedVis: getVisStateTable(
            indexPatternId,
            'package.name',
            'Top 5 installed packages',
            'it-hygiene-top-packages',
            {
              fieldCustomLabel: 'Top 5 installed packages',
            },
          ),
        },
      },
      t2: {
        gridData: {
          w: 12,
          h: 12,
          x: 12,
          y: 0,
          i: 't2',
        },
        type: 'visualization',
        explicitInput: {
          id: 't2',
          savedVis: getVisStateTable(
            indexPatternId,
            'process.name',
            'Top 5 running processes',
            'it-hygiene-top-processes',
            {
              fieldCustomLabel: 'Top 5 running processes',
              filters: [
                {
                  $state: {
                    store: 'appState',
                  },
                  exists: {
                    field: 'source.port',
                  },
                  meta: {
                    alias: null,
                    disabled: false,
                    key: 'source.port',
                    negate: true,
                    type: 'exists',
                    value: 'exists',
                    index: indexPatternId,
                  },
                },
              ],
            },
          ),
        },
      },
      t3: {
        gridData: {
          w: 12,
          h: 12,
          x: 24,
          y: 0,
          i: 't3',
        },
        type: 'visualization',
        explicitInput: {
          id: 't3',
          savedVis: getVisStateTable(
            indexPatternId,
            'host.os.name',
            'Top 5 operating systems',
            'it-hygiene-top-operating-system-names',
            {
              fieldCustomLabel: 'Top 5 operating systems',
            },
          ),
        },
      },
      t4: {
        gridData: {
          w: 12,
          h: 12,
          x: 36,
          y: 0,
          i: 't4',
        },
        type: 'visualization',
        explicitInput: {
          id: 't4',
          savedVis: getVisStateTable(
            indexPatternId,
            'host.cpu.name',
            'Top 5 CPUs',
            'it-hygiene-stat',
            {
              fieldCustomLabel: 'Top 5 host CPUs',
            },
          ),
        },
      },
    }).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ITHygieneTablesDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygieneTablesDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-tables-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene - Tables';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene Tables';
  }
}

export class ITHygieneTablesDashboardPanelsService {
  private static getOverviewDashboardPanels = (
    indexPatternId: string,
  ): DashboardByRendererPanels => {
    return new ITHygieneTablesDashboardByRendererConfig(
      indexPatternId,
    ).getDashboardPanels();
  };

  public static getDashboardPanels(
    indexPatternId: string,
  ): DashboardByRendererPanels {
    return this.getOverviewDashboardPanels(indexPatternId);
  }
}

import { getVisStateDashboardTables } from '../../../../lib';
import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';

export class SCATablesDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      getVisStateDashboardTables(indexPatternId, [
        {
          panelId: 't1',
          x: 0,
          field: 'agent.name',
          title: 'Top 5 agents',
          visIDPrefix: 'it-hygiene-stat',
          fieldCustomLabel: 'Top 5 agents',
        },
        {
          panelId: 't2',
          x: 12,
          field: 'policy.name',
          title: 'Top 5 policies',
          visIDPrefix: 'sca-top-policies',
          fieldCustomLabel: 'Top 5 policies',
        },
        {
          panelId: 't3',
          x: 24,
          field: 'check.name',
          title: 'Top 5 checks',
          visIDPrefix: 'sca-top-checks',
          fieldCustomLabel: 'Top 5 checks',
        },
        {
          panelId: 't4',
          x: 36,
          field: 'check.compliance',
          title: 'Top 5 compliance',
          visIDPrefix: 'sca-top-compliance',
          fieldCustomLabel: 'Top 5 compliance',
        },
      ]),
    ).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class SCATablesDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new SCATablesDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'sca-tables-dashboard';
  }

  protected override getTitle(): string {
    return 'Software Composition Analysis Tables';
  }

  protected override getDescription(): string {
    return 'Dashboard for Software Composition Analysis (SCA) Tables';
  }
}

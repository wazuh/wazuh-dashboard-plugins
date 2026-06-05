import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateAlertsEvolution,
  getVisStateAttacksByTechnique,
  getVisStateTechniqueByAgent,
  getVisStateTopTactics,
  getVisStateTopTacticsByAgent,
} from '../vis-states';

export class MitreOverviewDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 36,
          h: 12,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateAlertsEvolution(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 12,
          x: 36,
          y: 0,
        },
        savedVis: getVisStateTopTactics(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 12,
          x: 0,
          y: 12,
        },
        savedVis: getVisStateAttacksByTechnique(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 12,
          x: 16,
          y: 12,
        },
        savedVis: getVisStateTopTacticsByAgent(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 12,
          x: 32,
          y: 12,
        },
        savedVis: getVisStateTechniqueByAgent(indexPatternId),
      },
    );
  }
}

export class MitreOverviewDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new MitreOverviewDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'mitre-overview-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'MITRE overview dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the MITRE overview';
  }
}

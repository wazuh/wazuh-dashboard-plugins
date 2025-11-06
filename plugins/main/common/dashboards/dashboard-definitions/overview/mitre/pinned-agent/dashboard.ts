import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateAlertsEvolution,
  getVisStateAlertsLevelByAttack,
  getVisStateAlertsLevelByTactic,
  getVisStateMitreAttacksByTactic,
  getVisStateTopTactics
} from '../vis-states';

export class MitrePinnedAgentDashboardLayoutDefinition extends DashboardLayoutDefinition {
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
        savedVis: getVisStateAlertsLevelByAttack(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 12,
          x: 16,
          y: 12,
        },
        savedVis: getVisStateMitreAttacksByTactic(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 12,
          x: 32,
          y: 12,
        },
        savedVis: getVisStateAlertsLevelByTactic(indexPatternId),
      },
    );
  }
}

export class MitrePinnedAgentDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new MitrePinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'mitre-pinned-agent-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'MITRE pinned agent dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the MITRE pinned agent';
  }
}

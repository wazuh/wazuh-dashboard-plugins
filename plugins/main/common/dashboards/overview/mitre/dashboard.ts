import {
  DashboardByRendererConfig,
  DashboardLayoutConfig,
} from '../../dashboard-builder';
import {
  getVisStateAlertsEvolution,
  getVisStateAlertsLevelByAttack,
  getVisStateAlertsLevelByTactic,
  getVisStateAttacksByTechnique,
  getVisStateMitreAttacksByTactic,
  getVisStateTechniqueByAgent,
  getVisStateTopTactics,
  getVisStateTopTacticsByAgent,
} from './vis-states';

export abstract class MitreDashboardLayoutConfig extends DashboardLayoutConfig {}

export class MitreOverviewDashboardLayoutConfig extends MitreDashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super();
    this.gridVisualizationItems.push(
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

export class MitrePinnedAgentDashboardLayoutConfig extends MitreDashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super();
    this.gridVisualizationItems.push(
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

export abstract class MitreDashboardByRendererConfig extends DashboardByRendererConfig {}

export class MitreOverviewDashboardByRendererConfig extends MitreDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new MitreOverviewDashboardLayoutConfig(indexPatternId),
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

export class MitrePinnedAgentDashboardByRendererConfig extends MitreDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new MitrePinnedAgentDashboardLayoutConfig(indexPatternId),
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

import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../lib/dashboard-config-service';
import {
  getVisStateAlertEvolutionTop5Agents,
  getVisStateAlertsAgents,
  getVisStatePinnedAgentTop10AlertGroupsEvolution,
  getVisStateTop10AlertLevelEvolution,
  getVisStateTop10MITREATTACKS,
  getVisStateTop5Agents,
  getVisStateTop5AlertsAgents,
  getVisStateTop5PCIDSSRequirementsAgents,
  getVisStateTop5RuleGroupsAgents,
} from './vis-states';

export abstract class ThreatHuntingDashboardLayoutDefinition extends DashboardLayoutDefinition {}

export class ThreatHuntingPinnedAgentDashboardLayoutDefinition extends ThreatHuntingDashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values({
      '9': {
        gridData: {
          w: 24,
          h: 13,
          x: 0,
          y: 0,
          i: '9',
        },
        type: 'visualization',
        explicitInput: {
          id: '9',
          savedVis:
            getVisStatePinnedAgentTop10AlertGroupsEvolution(indexPatternId),
        },
      },
      '10': {
        gridData: {
          w: 24,
          h: 13,
          x: 24,
          y: 0,
          i: '10',
        },
        type: 'visualization',
        explicitInput: {
          id: '10',
          savedVis: getVisStateAlertsAgents(indexPatternId),
        },
      },
      '11': {
        gridData: {
          w: 16,
          h: 13,
          x: 0,
          y: 13,
          i: '11',
        },
        type: 'visualization',
        explicitInput: {
          id: '11',
          savedVis: getVisStateTop5AlertsAgents(indexPatternId),
        },
      },
      '12': {
        gridData: {
          w: 16,
          h: 13,
          x: 16,
          y: 13,
          i: '12',
        },
        type: 'visualization',
        explicitInput: {
          id: '12',
          savedVis: getVisStateTop5RuleGroupsAgents(indexPatternId),
        },
      },
      '13': {
        gridData: {
          w: 16,
          h: 13,
          x: 32,
          y: 13,
          i: '13',
        },
        type: 'visualization',
        explicitInput: {
          id: '13',
          savedVis: getVisStateTop5PCIDSSRequirementsAgents(indexPatternId),
        },
      },
    }).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ThreatHuntingOverviewDashboardLayoutDefinition extends ThreatHuntingDashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values({
      '5': {
        gridData: {
          w: 28,
          h: 13,
          x: 0,
          y: 0,
          i: '5',
        },
        type: 'visualization',
        explicitInput: {
          id: '5',
          savedVis: getVisStateTop10AlertLevelEvolution(indexPatternId),
        },
      },
      '6': {
        gridData: {
          w: 20,
          h: 13,
          x: 28,
          y: 0,
          i: '6',
        },
        type: 'visualization',
        explicitInput: {
          id: '6',
          savedVis: getVisStateTop10MITREATTACKS(indexPatternId),
        },
      },
      '7': {
        gridData: {
          w: 15,
          h: 12,
          x: 0,
          y: 13,
          i: '7',
        },
        type: 'visualization',
        explicitInput: {
          id: '7',
          savedVis: getVisStateTop5Agents(indexPatternId),
        },
      },
      '8': {
        gridData: {
          w: 33,
          h: 12,
          x: 15,
          y: 13,
          i: '8',
        },
        type: 'visualization',
        explicitInput: {
          id: '8',
          savedVis: getVisStateAlertEvolutionTop5Agents(indexPatternId),
        },
      },
    }).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export abstract class ThreatHuntingDashboardConfig extends DashboardConfig {}

export class ThreatHuntingPinnedAgentDashboardConfig extends ThreatHuntingDashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ThreatHuntingPinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'threat-hunting-pinned-agent-dashboard';
  }
  protected override getTitle(): string {
    return 'Threat Hunting - Pinned Agent';
  }
  protected override getDescription(): string {
    return 'Dashboard of Threat Hunting - Pinned Agent';
  }
}

export class ThreatHuntingOverviewDashboardConfig extends ThreatHuntingDashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ThreatHuntingOverviewDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'threat-hunting-overview-dashboard';
  }
  protected override getTitle(): string {
    return 'Threat Hunting - Overview';
  }
  protected override getDescription(): string {
    return 'Dashboard of Threat Hunting - Overview';
  }
}

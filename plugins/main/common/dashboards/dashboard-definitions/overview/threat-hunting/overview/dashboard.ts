import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateAlertEvolutionTop5Agents,
  getVisStateTop10AlertLevelEvolution,
  getVisStateTop10MITREATTACKS,
  getVisStateTop5Agents
} from '../vis-states';

export class ThreatHuntingOverviewDashboardLayoutDefinition extends DashboardLayoutDefinition {
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

export class ThreatHuntingOverviewDashboardConfig extends DashboardConfig {
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

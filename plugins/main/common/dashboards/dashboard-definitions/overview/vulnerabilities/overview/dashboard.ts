import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateAccumulationMostDetectedVulnerabilities,
  getVisStateTopVulnerabilitiesScore,
  getVisStateTopVulnerableOSFamilies,
} from '../vis-states';

export class VulnerabilitiesOverviewDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values({
      '6': {
        gridData: {
          w: 16,
          h: 12,
          x: 0,
          y: 0,
          i: '6',
        },
        type: 'visualization',
        explicitInput: {
          id: '6',
          savedVis: getVisStateTopVulnerabilitiesScore(indexPatternId),
        },
      },
      '7': {
        gridData: {
          w: 16,
          h: 12,
          x: 16,
          y: 0,
          i: '7',
        },
        type: 'visualization',
        explicitInput: {
          id: '7',
          savedVis: getVisStateTopVulnerableOSFamilies(indexPatternId),
        },
      },
      '8': {
        gridData: {
          w: 16,
          h: 12,
          x: 32,
          y: 0,
          i: '8',
        },
        type: 'visualization',
        explicitInput: {
          id: '8',
          savedVis:
            getVisStateAccumulationMostDetectedVulnerabilities(indexPatternId),
        },
      },
    }).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class VulnerabilitiesOverviewDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new VulnerabilitiesOverviewDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'vulnerabilities-overview-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'Vulnerabilities Overview';
  }
  protected override getDescription(): string {
    return 'Dashboard of Vulnerabilities Overview';
  }
}

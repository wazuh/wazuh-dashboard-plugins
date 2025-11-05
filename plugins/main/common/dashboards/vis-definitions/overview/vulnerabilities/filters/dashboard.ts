import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import { getVisStateFilter } from '../../it-hygiene/packages/inventories/packages/vis-states';

export class VulnerabilitiesFiltersDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values({
      '1': {
        gridData: {
          w: 9,
          h: 12,
          x: 0,
          y: 0,
          i: '1',
        },
        type: 'visualization',
        explicitInput: {
          id: '1',
          savedVis: getVisStateFilter(
            'topVulnerabilities',
            indexPatternId,
            'Top vulnerabilities',
            'Top 5 vulnerabilities',
            'vulnerability.id',
          ),
        },
      },
      '2': {
        gridData: {
          w: 15,
          h: 12,
          x: 9,
          y: 0,
          i: '2',
        },
        type: 'visualization',
        explicitInput: {
          id: '2',
          savedVis: getVisStateFilter(
            'topOSVulnerabilities',
            indexPatternId,
            'Top operating system vulnerabilities',
            'Top 5 OS',
            'host.os.full',
          ),
        },
      },
      '3': {
        gridData: {
          w: 15,
          h: 12,
          x: 24,
          y: 0,
          i: '3',
        },
        type: 'visualization',
        explicitInput: {
          id: '3',
          savedVis: getVisStateFilter(
            'topAgentVulnerabilities',
            indexPatternId,
            'Agent filter',
            'Top 5 agents',
            'agent.name',
          ),
        },
      },
      '4': {
        gridData: {
          w: 9,
          h: 12,
          x: 39,
          y: 0,
          i: '4',
        },
        type: 'visualization',
        explicitInput: {
          id: '4',
          savedVis: getVisStateFilter(
            'topPackageSelector',
            indexPatternId,
            'Top packages vulnerabilities',
            'Top 5 packages',
            'package.name',
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

export class VulnerabilitiesFiltersDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new VulnerabilitiesFiltersDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'vulnerabilities-filters-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'Vulnerabilities Filters';
  }
  protected override getDescription(): string {
    return 'Dashboard of Vulnerabilities Filters';
  }
}

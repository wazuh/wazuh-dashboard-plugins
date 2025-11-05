import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateEvaluatedEvaluationPending,
  getVisStateSeverityCritical,
  getVisStateSeverityHigh,
  getVisStateSeverityLow,
  getVisStateSeverityMedium,
} from './vis-states';

export class VulnerabilitiesKPIsDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values({
      '1': {
        gridData: {
          w: 9,
          h: 6,
          x: 0,
          y: 0,
          i: '1',
        },
        type: 'visualization',
        explicitInput: {
          id: '1',
          savedVis: getVisStateSeverityCritical(indexPatternId),
        },
      },
      '2': {
        gridData: {
          w: 9,
          h: 6,
          x: 9,
          y: 0,
          i: '2',
        },
        type: 'visualization',
        explicitInput: {
          id: '2',
          savedVis: getVisStateSeverityHigh(indexPatternId),
        },
      },
      '3': {
        gridData: {
          w: 9,
          h: 6,
          x: 18,
          y: 0,
          i: '3',
        },
        type: 'visualization',
        explicitInput: {
          id: '3',
          savedVis: getVisStateSeverityMedium(indexPatternId),
        },
      },
      '4': {
        gridData: {
          w: 9,
          h: 6,
          x: 27,
          y: 0,
          i: '4',
        },
        type: 'visualization',
        explicitInput: {
          id: '4',
          savedVis: getVisStateSeverityLow(indexPatternId),
        },
      },
      '5': {
        gridData: {
          w: 12,
          h: 6,
          x: 36,
          y: 0,
          i: '5',
        },
        type: 'visualization',
        explicitInput: {
          id: '5',
          savedVis: getVisStateEvaluatedEvaluationPending(indexPatternId),
        },
      },
    }).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class VulnerabilitiesKPIsDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new VulnerabilitiesKPIsDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'vulnerabilities-kpis-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'Vulnerabilities KPIs';
  }
  protected override getDescription(): string {
    return 'Dashboard of Vulnerabilities KPIs';
  }
}

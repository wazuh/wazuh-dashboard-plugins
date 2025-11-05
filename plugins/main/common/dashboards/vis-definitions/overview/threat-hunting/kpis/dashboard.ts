import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateAuthenticationFailure,
  getVisStateAuthenticationSuccess,
  getVisStateLevel12Alerts,
  getVisStateTotal,
} from './vis-states';

export class ThreatHuntingKPIsDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values({
      '1': {
        gridData: {
          w: 12,
          h: 6,
          x: 0,
          y: 0,
          i: '1',
        },
        type: 'visualization',
        explicitInput: {
          id: '1',
          savedVis: getVisStateTotal(indexPatternId),
        },
      },
      '2': {
        gridData: {
          w: 12,
          h: 6,
          x: 12,
          y: 0,
          i: '2',
        },
        type: 'visualization',
        explicitInput: {
          id: '2',
          savedVis: getVisStateLevel12Alerts(indexPatternId),
        },
      },
      '3': {
        gridData: {
          w: 12,
          h: 6,
          x: 24,
          y: 0,
          i: '3',
        },
        type: 'visualization',
        explicitInput: {
          id: '3',
          savedVis: getVisStateAuthenticationFailure(indexPatternId),
        },
      },
      '4': {
        gridData: {
          w: 12,
          h: 6,
          x: 36,
          y: 0,
          i: '4',
        },
        type: 'visualization',
        explicitInput: {
          id: '4',
          savedVis: getVisStateAuthenticationSuccess(indexPatternId),
        },
      },
    }).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ThreatHuntingKPIsDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ThreatHuntingKPIsDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'threat-hunting-kpis-dashboard';
  }
  protected override getTitle(): string {
    return 'Threat Hunting - KPIs Dashboard';
  }
  protected override getDescription(): string {
    return 'Dashboard of Threat Hunting - KPIs';
  }
}

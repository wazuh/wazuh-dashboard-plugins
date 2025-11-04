import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-builder';
import {
  getVisStateFullAccess,
  getVisStateMaxRuleLevel,
  getVisStatePhishingMalware,
  getVisStateSuspiciousDownloads,
} from './vis-states';

export class OfficeKPIsDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 12,
          h: 6,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateMaxRuleLevel(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 6,
          x: 12,
          y: 0,
        },
        savedVis: getVisStateSuspiciousDownloads(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 6,
          x: 24,
          y: 0,
        },
        savedVis: getVisStateFullAccess(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 6,
          x: 36,
          y: 0,
        },
        savedVis: getVisStatePhishingMalware(indexPatternId),
      },
    );
  }
}

export class OfficeKPIsDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new OfficeKPIsDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'office-overview-kpis';
  }
  protected override getTitle(): string {
    return 'Office Overview KPIs';
  }
  protected override getDescription(): string {
    return 'Key Performance Indicators for Office Overview';
  }
}

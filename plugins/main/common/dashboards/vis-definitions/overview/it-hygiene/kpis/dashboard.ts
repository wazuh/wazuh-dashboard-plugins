import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
} from '../../../../lib';
import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-builder';
import { getVisStateHostsTotalFreeMemoryTable } from '../vis-states';

export class ITHygieneKPIsDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 16,
          h: 9,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateTable(
          indexPatternId,
          'host.os.platform',
          '',
          'it-hygiene-top-operating-system-names',
          { fieldCustomLabel: 'Operating system families' },
        ),
      },
      {
        gridData: {
          w: 16,
          h: 9,
          x: 16,
          y: 0,
        },
        savedVis: getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'package.type',
          'Package types',
          'it-hygiene-system',
          {
            fieldSize: 4,
            otherBucket: 'Others',
            metricCustomLabel: 'Package types count',
            valueAxesTitleText: ' ',
            fieldCustomLabel: 'Package type',
            seriesLabel: 'Package type',
          },
        ),
      },
      {
        gridData: {
          w: 16,
          h: 9,
          x: 32,
          y: 0,
        },
        savedVis: getVisStateHostsTotalFreeMemoryTable(
          indexPatternId,
          'host.memory.total',
          '',
          'it-hygiene-stat',
          { customLabel: 'Hosts total memory' },
        ),
      },
    );
  }
}

export class ITHygieneKPIsDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygieneKPIsDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-dashboard-kpis';
  }
  protected override getTitle(): string {
    return 'IT Hygiene dashboard KPIs';
  }
  protected override getDescription(): string {
    return 'Dashboard of the IT Hygiene KPIs';
  }
}

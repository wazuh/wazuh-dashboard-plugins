import { getVisStateHostsTotalFreeMemoryTable } from '../../../dashboards/dashboard-kpi';
import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
} from '../../../../../../../common/dashboards/lib';

export const getOverviewSystemHardwareTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'host.cpu.name',
      'Top 5 CPU names',
      'it-hygiene-hardware',
      { fieldCustomLabel: 'CPUs' },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'host.cpu.cores',
      'Top 5 CPU cores',
      'it-hygiene-hardware',
      { fieldCustomLabel: 'Cores count' },
    ),
    getVisStateHostsTotalFreeMemoryTable(
      indexPatternId,
      'host.memory.total',
      '',
      'it-hygiene-stat',
      { customLabel: 'Hosts total memory' },
    ),
  ]);
};

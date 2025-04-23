import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import {
  getVisStateDHCPEnabledInterfacesMetric,
  getVisStateNetworkAveragePriorityMetric,
} from '../common/dashboard';

export const getOverviewNetworksProtocolsTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateNetworkAveragePriorityMetric(indexPatternId),
    getVisStateDHCPEnabledInterfacesMetric(indexPatternId),
  ]);
};

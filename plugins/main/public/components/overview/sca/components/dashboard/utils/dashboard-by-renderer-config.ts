import { ViewMode } from '../../../../../../../../../src/plugins/embeddable/public';
import { getKPIsPanel } from './dashboard-kpis';
import { getDashboardTables } from './dashboard-tables';
import { getDashboardPanels } from './dashboard-panels';
import { Query } from '../../../../../../../../../src/plugins/data/public';

interface DashboardConfigParams {
  indexPatternId: string;
  fetchFilters: any[];
  dateRangeFrom: string;
  dateRangeTo: string;
  query: Query;
  fingerprint: number;
}

interface ConfigOverrides {
  panels: any;
  id: string;
  title: string;
  description: string;
  useMargins: boolean;
  hidePanelTitles: boolean;
}

/**
 * Base function to generate a DashboardByRenderer input config
 */
const buildDashboardConfig = (
  {
    indexPatternId,
    fetchFilters,
    dateRangeFrom,
    dateRangeTo,
    query,
    fingerprint,
  }: DashboardConfigParams,
  overrides: ConfigOverrides,
) => ({
  viewMode: ViewMode.VIEW,
  panels: overrides.panels,
  isFullScreenMode: false,
  filters: fetchFilters ?? [],
  useMargins: overrides.useMargins,
  id: overrides.id,
  timeRange: {
    from: dateRangeFrom,
    to: dateRangeTo,
  },
  title: overrides.title,
  description: overrides.description,
  query,
  refreshConfig: {
    pause: false,
    value: 15,
  },
  hidePanelTitles: overrides.hidePanelTitles,
  lastReloadRequestTime: fingerprint,
});

// ---- Specific configs ---- //

export const getKPIsConfig = (params: DashboardConfigParams) =>
  buildDashboardConfig(params, {
    panels: getKPIsPanel(params.indexPatternId),
    id: 'security-configuration-assessment-kpis',
    title: 'Security Configuration Assessment dashboard KPIs',
    description: 'Dashboard of the SCA KPIs',
    useMargins: true,
    hidePanelTitles: true,
  });

export const getTablesConfig = (params: DashboardConfigParams) =>
  buildDashboardConfig(params, {
    panels: getDashboardTables(params.indexPatternId),
    id: 'security-configuration-assessment-tables',
    title: 'Security Configuration Assessment dashboard tables',
    description: 'Dashboard of the SCA tables',
    useMargins: false,
    hidePanelTitles: true,
  });

export const getPanelsConfig = (params: DashboardConfigParams) =>
  buildDashboardConfig(params, {
    panels: getDashboardPanels(params.indexPatternId),
    id: 'security-configuration-assessment-panels',
    title: 'Security Configuration Assessment dashboard panels',
    description: 'Dashboard of the SCA panels',
    useMargins: true,
    hidePanelTitles: false,
  });

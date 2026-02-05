import { getVisStateDashboardTables } from '../../../../it-hygiene/common/saved-vis/generators';

export const getDashboardTables = (indexPatternId: string) =>
  getVisStateDashboardTables(indexPatternId, [
    {
      panelId: 't1',
      x: 0,
      field: 'wazuh.agent.name',
      title: 'Top 5 agents',
      visIDPrefix: 'it-hygiene-stat',
      fieldCustomLabel: 'Top 5 agents',
    },
    {
      panelId: 't2',
      x: 12,
      field: 'policy.name',
      title: 'Top 5 policies',
      visIDPrefix: 'sca-top-policies',
      fieldCustomLabel: 'Top 5 policies',
    },
    {
      panelId: 't3',
      x: 24,
      field: 'check.name',
      title: 'Top 5 checks',
      visIDPrefix: 'sca-top-checks',
      fieldCustomLabel: 'Top 5 checks',
    },
    {
      panelId: 't4',
      x: 36,
      field: 'check.compliance',
      title: 'Top 5 compliance',
      visIDPrefix: 'sca-top-compliance',
      fieldCustomLabel: 'Top 5 compliance',
    },
  ]);

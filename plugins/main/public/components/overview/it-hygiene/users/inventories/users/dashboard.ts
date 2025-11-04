import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
} from '../../../../../../../common/dashboards/lib';

export const getOverviewUsersUsersTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'user.name',
      'Top 5 users',
      'it-hygiene-users',
      { fieldCustomLabel: 'Users' },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'user.groups',
      'Top 5 user groups',
      'it-hygiene-users',
      { fieldCustomLabel: 'User groups' },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'user.shell',
      'Top 5 user shells',
      'it-hygiene-users',
      { fieldCustomLabel: 'User shells' },
    ),
  ]);
};

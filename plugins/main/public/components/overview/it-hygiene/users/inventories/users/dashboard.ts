import { i18n } from '@osd/i18n';
import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateHorizontalBarByField,
} from '../../../../../../services/visualizations';
import { SavedVis } from '../../../common/types';

const getVisStateUniqueUsersMetric = (indexPatternId: string): SavedVis => {
  return {
    id: 'it-hygiene-users-unique-count',
    title: i18n.translate('wazuh.itHygiene.usersDashboard.uniqueUsers.title', {
      defaultMessage: 'Unique users',
    }),
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Green to Red',
        metricColorMode: 'None',
        colorsRange: [
          {
            from: 0,
            to: 10000,
          },
        ],
        labels: {
          show: true,
        },
        invertColors: false,
        style: STYLE,
      },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'cardinality',
          params: {
            field: 'user.name',
            customLabel: i18n.translate(
              'wazuh.itHygiene.usersDashboard.uniqueUsers.label',
              { defaultMessage: 'Unique users' },
            ),
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getOverviewUsersUsersTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'user.name',
      i18n.translate('wazuh.itHygiene.usersDashboard.topUsers.title', {
        defaultMessage: 'Top 5 users',
      }),
      'it-hygiene-users',
      {
        fieldCustomLabel: i18n.translate(
          'wazuh.itHygiene.usersDashboard.topUsers.fieldLabel',
          { defaultMessage: 'Users' },
        ),
      },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'user.groups',
      i18n.translate('wazuh.itHygiene.usersDashboard.topUserGroups.title', {
        defaultMessage: 'Top 5 user groups',
      }),
      'it-hygiene-users',
      {
        fieldCustomLabel: i18n.translate(
          'wazuh.itHygiene.usersDashboard.topUserGroups.fieldLabel',
          { defaultMessage: 'User groups' },
        ),
      },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'user.shell',
      i18n.translate('wazuh.itHygiene.usersDashboard.topUserShells.title', {
        defaultMessage: 'Top 5 user shells',
      }),
      'it-hygiene-users',
      {
        fieldCustomLabel: i18n.translate(
          'wazuh.itHygiene.usersDashboard.topUserShells.fieldLabel',
          { defaultMessage: 'User shells' },
        ),
      },
    ),
  ]);
};

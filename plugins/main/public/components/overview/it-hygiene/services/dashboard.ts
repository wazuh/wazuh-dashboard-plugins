import { buildDashboardKPIPanels } from '../common/create-dashboard-panels-kpis';
import {
  getVisStateHorizontalBarByField,
  getVisStatePieByField,
} from '../common/saved-vis/generators';
import { getVisStateHorizontalBarSplitSeries } from '../../../../services/visualizations';

import { SavedVis } from '../common/types';

export const getOverviewServicesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'agent.name',
      'Top 5 agents with failed services',
      'it-hygiene-services-failed-by-agent',
      {
        customLabel: 'Failed services count',
        filter: [
          {
            query: {
              bool: {
                filter: [
                  {
                    bool: {
                      must: [
                        {
                          bool: {
                            should: [
                              {
                                bool: {
                                  must: [
                                    { exists: { field: 'service.exit_code' } },
                                    {
                                      bool: {
                                        must_not: [
                                          { term: { 'service.exit_code': 0 } },
                                        ],
                                      },
                                    },
                                  ],
                                },
                              },
                              {
                                bool: {
                                  must: [
                                    {
                                      exists: {
                                        field: 'service.win32_exit_code',
                                      },
                                    },
                                    {
                                      bool: {
                                        must_not: [
                                          {
                                            term: {
                                              'service.win32_exit_code': 0,
                                            },
                                          },
                                        ],
                                      },
                                    },
                                  ],
                                },
                              },
                            ],
                            minimum_should_match: 1,
                          },
                        },
                      ],
                      must_not: [
                        {
                          terms: {
                            'service.state.keyword': ['RUNNING', 'active'],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'service.state',
      'Services by state',
      'it-hygiene-services-state',
      {
        fieldSize: 5,
        otherBucket: 'Others',
        metricCustomLabel: 'Service by state count',
        valueAxesTitleText: ' ',
        seriesLabel: 'Type',
        seriesMode: 'stacked',
        fieldCustomLabel: 'Type',
      },
    ),
  ]);
};

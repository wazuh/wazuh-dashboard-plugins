import { buildDashboardKPIPanels } from '../common/create-dashboard-panels-kpis';
import {
  getVisStateHorizontalBarByField,
  getVisStatePieByField,
} from '../common/saved-vis/generators';
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
                      must_not: [
                        {
                          term: {
                            'service.exit_code': 0,
                          },
                        },
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
    getVisStatePieByField(
      indexPatternId,
      'service.state',
      'Services by state',
      'it-hygiene-services-state',
    ),
  ]);
};

import React from 'react';
import { EuiIcon, EuiPanel } from '@elastic/eui';
import { SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT } from '../../../../../common/constants';
import { TableWzAPI } from '../../../common/tables';
import { WzRequest } from '../../../../react-services';
import { get as getLodash } from 'lodash';
import { processColumns } from '../columns';
import { withSOPlatformGuard } from './with-so-platform-guard';

const sortFieldSuggestion = (a, b) => (a.label > b.label ? 1 : -1);

export const ProcessesTable = withSOPlatformGuard(({ agent, soPlatform }) => {
  return (
    <EuiPanel data-test-subj='processes-table' paddingSize='m'>
      <TableWzAPI
        title='Processes'
        tableColumns={processColumns[soPlatform]}
        tableInitialSortingField={processColumns[soPlatform][0].field}
        endpoint={`/syscollector/${agent.id}/processes?select=${processColumns[
          soPlatform
        ]
          .map(({ field }) => field)
          .join(',')}`}
        searchTable
        downloadCsv
        showReload
        tablePageSizeOptions={[10, 25, 50, 100]}
        searchBarWQL={{
          suggestions: {
            field(currentValue) {
              return processColumns[soPlatform]
                .map(item => ({
                  label: item.field,
                  description: `filter by ${item.name}`,
                }))
                .sort(sortFieldSuggestion);
            },
            value: async (currentValue, { field }) => {
              try {
                const response = await WzRequest.apiReq(
                  'GET',
                  `/syscollector/${agent.id}/processes`,
                  {
                    params: {
                      distinct: true,
                      limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                      select: field,
                      sort: `+${field}`,
                      ...(currentValue
                        ? { q: `${field}~${currentValue}` }
                        : {}),
                    },
                  },
                );
                return response?.data?.data.affected_items.map(item => ({
                  label: getLodash(item, field),
                }));
              } catch (error) {
                return [];
              }
            },
          },
        }}
        tableProps={{
          tableLayout: 'auto',
        }}
      />
    </EuiPanel>
  );
});

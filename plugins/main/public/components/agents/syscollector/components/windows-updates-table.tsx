import React from 'react';
import { EuiPanel } from '@elastic/eui';
import { SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT } from '../../../../../common/constants';
import { TableWzAPI } from '../../../common/tables';
import { WzRequest } from '../../../../react-services';
import { get as getLodash } from 'lodash';
import { windowsUpdatesColumns } from '../columns';

const sortFieldSuggestion = (a, b) => (a.label > b.label ? 1 : -1);

export const WindowsUpdatesTable = ({ agent }) => {
  return (
    <EuiPanel data-test-subj='software-windows-updates-table' paddingSize='m'>
      <TableWzAPI
        title='Windows updates'
        tableColumns={windowsUpdatesColumns}
        tableInitialSortingField={windowsUpdatesColumns[0].field}
        endpoint={`/syscollector/${
          agent.id
        }/hotfixes?select=${windowsUpdatesColumns
          .map(({ field }) => field)
          .join(',')}`}
        searchTable
        downloadCsv
        showReload
        tablePageSizeOptions={[10, 25, 50, 100]}
        searchBarWQL={{
          suggestions: {
            field(currentValue) {
              return windowsUpdatesColumns
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
                  `/syscollector/${agent.id}/hotfixes`,
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
};

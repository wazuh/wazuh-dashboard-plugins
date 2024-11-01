import React from 'react';
import { EuiPanel } from '@elastic/eui';
import { SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT } from '../../../../../common/constants';
import { TableWzAPI } from '../../../common/tables';
import { WzRequest } from '../../../../react-services';
import { get as getLodash } from 'lodash';
import { netifaceColumns } from '../columns';

const sortFieldSuggestion = (a, b) => (a.label > b.label ? 1 : -1);

export const NetworkInterfacesTable = ({ agent }) => {
  return (
    <EuiPanel data-test-subj='network-interfaces-table' paddingSize='m'>
      <TableWzAPI
        title='Network interfaces'
        tableColumns={netifaceColumns}
        tableInitialSortingField={netifaceColumns[0]?.field}
        endpoint={`/syscollector/${agent.id}/netiface?select=${netifaceColumns
          .map(({ field }) => field)
          .join(',')}`}
        searchTable
        downloadCsv
        showReload
        tablePageSizeOptions={[10, 25, 50, 100]}
        searchBarWQL={{
          suggestions: {
            field(currentValue) {
              return netifaceColumns
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
                  `/syscollector/${agent.id}/netiface`,
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

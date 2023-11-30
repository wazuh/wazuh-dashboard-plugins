import React from 'react';
import { EuiIcon, EuiPanel } from '@elastic/eui';
import { SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT } from '../../../../../common/constants';
import { TableWzAPI } from '../../../common/tables';
import { WzRequest } from '../../../../react-services';
import { get as getLodash } from 'lodash';
import { packagesColumns } from '../columns';

const sortFieldSuggestion = (a, b) => (a.label > b.label ? 1 : -1);

export default function PackagesTable({ agent, soPlatform }) {
  if (!soPlatform) {
    return (
      <EuiPanel paddingSize='s' style={{ margin: 16, textAlign: 'center' }}>
        <EuiIcon type='iInCircle' /> Not enough hardware or operating system
        information
      </EuiPanel>
    );
  }
  return (
    <EuiPanel paddingSize='m' style={{ margin: '12px 16px 12px 16px' }}>
      <TableWzAPI
        title='Packages'
        tableColumns={packagesColumns[soPlatform]}
        tableInitialSortingField={packagesColumns[soPlatform][0].field}
        endpoint={`/syscollector/${agent.id}/packages?select=${packagesColumns[
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
              return packagesColumns[soPlatform]
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
                  `/syscollector/${agent.id}/packages`,
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
}

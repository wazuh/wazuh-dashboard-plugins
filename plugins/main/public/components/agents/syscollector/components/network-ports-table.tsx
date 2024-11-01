import React from 'react';
import { EuiFlexItem, EuiFlexGroup, EuiIcon, EuiPanel } from '@elastic/eui';
import { SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT } from '../../../../../common/constants';
import { TableWzAPI } from '../../../common/tables';
import { WzRequest } from '../../../../react-services';
import { get as getLodash } from 'lodash';
import { portsColumns } from '../columns';
import { withSOPlatformGuard } from './with-so-platform-guard';

const sortFieldSuggestion = (a, b) => (a.label > b.label ? 1 : -1);

export const NetworkPortsTable = withSOPlatformGuard(
  ({ agent, soPlatform }) => {
    return (
      <EuiPanel data-test-subj='network-ports-table' paddingSize='m'>
        <TableWzAPI
          title='Network ports'
          tableColumns={portsColumns[soPlatform]}
          tableInitialSortingField={portsColumns[soPlatform]?.[0].field}
          endpoint={`/syscollector/${agent.id}/ports?select=${portsColumns[
            soPlatform
          ]
            ?.map(({ field }) => field)
            .join(',')}`}
          searchTable
          downloadCsv
          showReload
          tablePageSizeOptions={[10, 25, 50, 100]}
          searchBarWQL={{
            suggestions: {
              field(currentValue) {
                return portsColumns[soPlatform]
                  ?.map(item => ({
                    label: item.field,
                    description: `filter by ${item.name}`,
                  }))
                  .sort(sortFieldSuggestion);
              },
              value: async (currentValue, { field }) => {
                try {
                  const response = await WzRequest.apiReq(
                    'GET',
                    `/syscollector/${agent.id}/ports`,
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
  },
);

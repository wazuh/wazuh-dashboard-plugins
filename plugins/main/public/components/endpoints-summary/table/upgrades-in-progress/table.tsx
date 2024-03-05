import React from 'react';
import { EuiHealth } from '@elastic/eui';
import { TableWzAPI } from '../../../common/tables';
import { formatUIDate } from '../../../../react-services/time-service';
import {
  API_NAME_TASK_STATUS,
  SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
  UI_TASK_STATUS,
} from '../../../../../common/constants';
import { WzRequest } from '../../../../react-services/wz-request';
import { get as getLodash } from 'lodash';

export const AgentUpgradesTable = () => {
  const datetime = new Date();
  datetime.setMinutes(datetime.getMinutes() - 60);
  const formattedDate = datetime.toISOString();

  const defaultFilters = {
    q: `last_update_time>${formattedDate}`,
  };

  const searchBarWQLOptions = {
    implicitQuery: {
      query: 'id!=000',
      conjunction: ';',
    },
  };

  return (
    <TableWzAPI
      title='Upgrade agent tasks'
      endpoint='/tasks/status'
      tableColumns={[
        {
          field: 'task_id',
          name: 'Task id',
          sortable: true,
          searchable: true,
          show: true,
        },
        {
          field: 'agent_id',
          name: 'Agent id',
          sortable: true,
          searchable: true,
          show: true,
        },
        {
          field: 'create_time',
          name: 'Create',
          sortable: true,
          searchable: true,
          show: true,
          render: value => formatUIDate(value),
        },
        {
          field: 'last_update_time',
          name: 'Last update',
          sortable: true,
          searchable: true,
          show: true,
          render: value => formatUIDate(value),
        },
        {
          field: 'status',
          name: 'Status',
          width: '100px',
          sortable: true,
          searchable: true,
          show: true,
          render: value => (
            <EuiHealth
              color={
                value === API_NAME_TASK_STATUS.DONE
                  ? 'success'
                  : value === API_NAME_TASK_STATUS.IN_PROGRESS
                  ? 'warning'
                  : 'danger'
              }
            >
              {value}
            </EuiHealth>
          ),
        },
        {
          field: 'error_message',
          name: 'Error',
          show: true,
        },
      ]}
      tableInitialSortingField='last_update_time'
      tableInitialSortingDirection='desc'
      tablePageSizeOptions={[10, 25, 50, 100]}
      filters={defaultFilters}
      searchTable
      searchBarWQL={{
        suggestions: {
          field(currentValue) {
            return [
              { label: 'agent_id', description: 'filter by agent id' },
              { label: 'status', description: 'filter by status' },
              {
                label: 'create_time',
                description: 'filter by creation date',
              },
              {
                label: 'last_update_time',
                description: 'filter by last update date',
              },
              { label: 'task_id', description: 'filter by task id' },
            ];
          },
          value: async (currentValue, { field }) => {
            try {
              switch (field) {
                case 'status':
                  return UI_TASK_STATUS.map(status => ({
                    label: status,
                  }));
                case 'agent_id': {
                  const response = await WzRequest.apiReq('GET', '/agents', {
                    params: {
                      distinct: true,
                      limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                      select: 'id',
                      sort: `+id`,
                      ...(currentValue
                        ? {
                            q: `${searchBarWQLOptions.implicitQuery.query}${searchBarWQLOptions.implicitQuery.conjunction}id~${currentValue}`,
                          }
                        : {
                            q: `${searchBarWQLOptions.implicitQuery.query}`,
                          }),
                    },
                  });
                  return response?.data?.data.affected_items.map(item => ({
                    label: getLodash(item, 'id'),
                  }));
                }
              }
            } catch (error) {
              return [];
            }
          },
        },
        validate: {
          value: ({ formattedValue, value: rawValue }, { field }) => {
            const value = formattedValue ?? rawValue;
            if (value) {
              if (['create_time', 'last_update_time'].includes(field)) {
                const isCorrectDate =
                  /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}:\d{2}(.\d{1,6})?Z?)?$/.test(
                    value,
                  );
                return isCorrectDate
                  ? undefined
                  : `"${value}" is not a expected format. Valid formats: YYYY-MM-DD, YYYY-MM-DD HH:mm:ss, YYYY-MM-DDTHH:mm:ss, YYYY-MM-DDTHH:mm:ssZ.`;
              }
            }
          },
        },
      }}
      tableProps={{
        tableLayout: 'auto',
      }}
    />
  );
};

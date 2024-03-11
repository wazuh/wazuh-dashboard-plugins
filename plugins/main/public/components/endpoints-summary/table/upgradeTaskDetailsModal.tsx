import React from 'react';
import { EuiHealth, EuiIconTip } from '@elastic/eui';
import { TableWzAPI } from '../../common/tables';
import { formatUIDate } from '../../../react-services/time-service';
import {
  API_NAME_TASK_STATUS,
  SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
  UI_TASK_STATUS,
} from '../../../../common/constants';
import { WzRequest } from '../../../react-services/wz-request';
import { get as getLodash, uniqBy as uniqByLodash } from 'lodash';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
} from '@elastic/eui';

interface AgentUpgradesTaskDetailsModalProps {
  onClose: () => void;
}

export const AgentUpgradesTaskDetailsModal = ({
  onClose,
}: AgentUpgradesTaskDetailsModalProps) => {
  const datetime = new Date();
  datetime.setMinutes(datetime.getMinutes() - 60);
  const formattedDate = datetime.toISOString();

  const defaultFilters = {
    q: `last_update_time>${formattedDate}`,
  };

  const handleOnCloseModal = () => onClose();

  return (
    <EuiModal onClose={handleOnCloseModal} maxWidth={false}>
      <EuiModalHeader />
      <EuiModalBody>
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
              name: (
                <span>
                  Create{' '}
                  <EuiIconTip
                    content='This is not searchable through a search term.'
                    size='s'
                    color='subdued'
                    type='alert'
                  />
                </span>
              ),
              sortable: true,
              searchable: false,
              show: true,
              render: value => formatUIDate(value),
            },
            {
              field: 'last_update_time',
              name: (
                <span>
                  Last update{' '}
                  <EuiIconTip
                    content='This is not searchable through a search term.'
                    size='s'
                    color='subdued'
                    type='alert'
                  />
                </span>
              ),
              sortable: true,
              searchable: false,
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
              searchable: true,
            },
          ]}
          tableInitialSortingField='last_update_time'
          tableInitialSortingDirection='desc'
          tablePageSizeOptions={[10, 25, 50, 100]}
          filters={defaultFilters}
          downloadCsv
          showReload
          showFieldSelector
          searchTable
          searchBarWQL={{
            suggestions: {
              field(currentValue) {
                return [
                  {
                    label: 'agent_id',
                    description: 'filter by agent id',
                  },
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
                    default: {
                      const response = await WzRequest.apiReq(
                        'GET',
                        '/tasks/status',
                        {
                          params: {
                            limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                            select: field,
                            sort: `+${field}`,
                            ...(currentValue
                              ? {
                                  q: `${field}~${currentValue}`,
                                }
                              : {}),
                          },
                        },
                      );
                      const suggestionValues =
                        response?.data?.data.affected_items.map(item => ({
                          label: getLodash(item, field),
                        }));
                      return uniqByLodash(suggestionValues, 'label');
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
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButton onClick={handleOnCloseModal} fill>
          Close
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};

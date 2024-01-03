/*
 * Wazuh app - React component for building the agents table.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState, useEffect, useRef } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import { WzButtonPermissions } from '../../common/permissions/button';
import { withErrorBoundary } from '../../common/hocs';
import {
  UI_ORDER_AGENT_STATUS,
  AGENT_SYNCED_STATUS,
  SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
} from '../../../../common/constants';
import { TableWzAPI } from '../../common/tables';
import { WzRequest } from '../../../react-services/wz-request';
import { get as getLodash } from 'lodash';
import { getCore } from '../../../kibana-services';
import { endpointSummary } from '../../../utils/applications';
import { EditAgentGroupsModal } from './edit-groups-modal';
import { useUserPermissionsRequirements } from '../../common/hooks/useUserPermissions';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { updateCurrentAgentData } from '../../../redux/actions/appStateActions';
import { agentsTableColumns } from './columns';
import { AgentsTableGlobalActions } from './global-actions';

const searchBarWQLOptions = {
  implicitQuery: {
    query: 'id!=000',
    conjunction: ';',
  },
};

const mapDispatchToProps = dispatch => ({
  updateCurrentAgentData: data => dispatch(updateCurrentAgentData(data)),
});

interface AgentsTableProps {
  filters: any;
  updateCurrentAgentData: (agent) => void;
}

export const AgentsTable = compose(
  withErrorBoundary,
  connect(null, mapDispatchToProps),
)((props: AgentsTableProps) => {
  const defaultFilters = {
    default: { q: 'id!=000' },
    ...(sessionStorage.getItem('wz-agents-overview-table-filter')
      ? JSON.parse(sessionStorage.getItem('wz-agents-overview-table-filter'))
      : {}),
  };
  const [filters, setFilters] = useState(defaultFilters);
  const [reloadTable, setReloadTable] = useState(0);
  const [agent, setAgent] = useState();
  const [isEditGroupsVisible, setIsEditGroupsVisible] = useState(false);

  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const [denyEditGroups] = useUserPermissionsRequirements([
    { action: 'group:modify_assignments', resource: 'group:id:*' },
  ]);

  useEffect(() => {
    if (props.filters && Object.keys(props.filters).length) {
      setFilters(props.filters);
    }
  }, [props.filters]);

  useEffect(() => {
    //Unmount component
    return () => {
      if (sessionStorage.getItem('wz-agents-overview-table-filter')) {
        sessionStorage.removeItem('wz-agents-overview-table-filter');
      }
    };
  }, []);

  const reloadAgents = async () => {
    await setReloadTable(Date.now());
  };

  const onSelectionChange = (selectedItems: any[]) => {
    setSelectedItems(selectedItems);
  };

  const selection = {
    onSelectionChange: onSelectionChange,
  };

  const getRowProps = item => {
    const { id } = item;
    return {
      'data-test-subj': `row-${id}`,
      className: 'customRowClass',
      onClick: () => {},
    };
  };

  const getCellProps = (item, column) => {
    if (column.field == 'actions') {
      return;
    }
    return {
      onClick: ev => {
        props.updateCurrentAgentData(item);
        getCore().application.navigateToApp(endpointSummary.id, {
          path: `#/agents?tab=welcome&agent=${item.id}`,
        });
      },
    };
  };

  const tableRender = () => {
    // The EuiBasicTable tableLayout is set to "auto" to improve the use of empty space in the component.
    // Previously the tableLayout is set to "fixed" with percentage width for each column, but the use of space was not optimal.
    // Important: If all the columns have the truncateText property set to true, the table cannot adjust properly when the viewport size is small.
    return (
      <EuiFlexGroup className='wz-overflow-auto'>
        <EuiFlexItem>
          <TableWzAPI
            title='Agents'
            actionButtons={[
              <AgentsTableGlobalActions
                agents={selectedItems}
                allowEditGroups={!denyEditGroups}
              />,
              <WzButtonPermissions
                buttonType='empty'
                permissions={[{ action: 'agent:create', resource: '*:*:*' }]}
                iconType='plusInCircle'
                href={getCore().application.getUrlForApp(endpointSummary.id, {
                  path: `#${endpointSummary.redirectTo()}deploy`,
                })}
              >
                Deploy new agent
              </WzButtonPermissions>,
            ]}
            endpoint='/agents'
            tableColumns={agentsTableColumns(
              !denyEditGroups,
              setAgent,
              setIsEditGroupsVisible,
              setFilters,
            )}
            tableInitialSortingField='id'
            tablePageSizeOptions={[10, 25, 50, 100]}
            reload={reloadTable}
            mapResponseItem={item => {
              return {
                ...item,
                ...(item.ip ? { ip: item.ip } : { ip: '-' }),
                ...(item.node_name !== 'unknown'
                  ? { node_name: item.node_name }
                  : { node_name: '-' }),
                /*
                  The agent version contains the Wazuh word, this gets the string starting with
                  v<NUMBER><ANYTHING>
                  */
                ...(typeof item.version === 'string'
                  ? { version: item.version.match(/(v\d.+)/)?.[1] }
                  : { version: '-' }),
              };
            }}
            rowProps={getRowProps}
            filters={filters}
            downloadCsv
            showReload
            showFieldSelector
            searchTable
            searchBarWQL={{
              options: searchBarWQLOptions,
              suggestions: {
                field(currentValue) {
                  return [
                    {
                      label: 'dateAdd',
                      description: 'filter by registration date',
                    },
                    { label: 'id', description: 'filter by id' },
                    { label: 'ip', description: 'filter by IP address' },
                    { label: 'group', description: 'filter by group' },
                    {
                      label: 'group_config_status',
                      description: 'filter by group configuration status',
                    },
                    {
                      label: 'lastKeepAlive',
                      description: 'filter by last keep alive',
                    },
                    { label: 'manager', description: 'filter by manager' },
                    { label: 'name', description: 'filter by name' },
                    {
                      label: 'node_name',
                      description: 'filter by cluster name',
                    },
                    {
                      label: 'os.name',
                      description: 'filter by operating system name',
                    },
                    {
                      label: 'os.platform',
                      description: 'filter by operating platform',
                    },
                    {
                      label: 'os.version',
                      description: 'filter by operating system version',
                    },
                    { label: 'status', description: 'filter by status' },
                    { label: 'version', description: 'filter by version' },
                  ];
                },
                value: async (currentValue, { field }) => {
                  try {
                    switch (field) {
                      case 'status':
                        return UI_ORDER_AGENT_STATUS.map(status => ({
                          label: status,
                        }));
                      case 'group_config_status':
                        return [
                          AGENT_SYNCED_STATUS.SYNCED,
                          AGENT_SYNCED_STATUS.NOT_SYNCED,
                        ].map(label => ({
                          label,
                        }));
                      default: {
                        const response = await WzRequest.apiReq(
                          'GET',
                          '/agents',
                          {
                            params: {
                              distinct: true,
                              limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                              select: field,
                              sort: `+${field}`,
                              ...(currentValue
                                ? {
                                    q: `${searchBarWQLOptions.implicitQuery.query}${searchBarWQLOptions.implicitQuery.conjunction}${field}~${currentValue}`,
                                  }
                                : {
                                    q: `${searchBarWQLOptions.implicitQuery.query}`,
                                  }),
                            },
                          },
                        );
                        if (field === 'group') {
                          /* the group field is returned as an string[],
                            example: ['group1', 'group2']

                            Due the API request done to get the distinct values for the groups is
                            not returning the exepected values, as workaround, the values are
                            extracted in the frontend using the returned results.

                            This API request to get the distint values of groups doesn't
                            return the unique values for the groups, else the unique combination
                            of groups.
                            */
                          return response?.data?.data.affected_items
                            .map(item => getLodash(item, field))
                            .flat()
                            .filter(
                              (item, index, array) =>
                                array.indexOf(item) === index,
                            )
                            .sort()
                            .map(group => ({ label: group }));
                        }
                        return response?.data?.data.affected_items.map(
                          item => ({
                            label: getLodash(item, field),
                          }),
                        );
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
                    if (['dateAdd', 'lastKeepAlive'].includes(field)) {
                      return /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}:\d{2}(.\d{1,6})?Z?)?$/.test(
                        value,
                      )
                        ? undefined
                        : `"${value}" is not a expected format. Valid formats: YYYY-MM-DD, YYYY-MM-DD HH:mm:ss, YYYY-MM-DDTHH:mm:ss, YYYY-MM-DDTHH:mm:ssZ.`;
                    }
                  }
                },
              },
            }}
            saveStateStorage={{
              system: 'localStorage',
              key: 'wz-agents-overview-table',
            }}
            tableProps={{
              itemId: 'id',
              tableLayout: 'auto',
              cellProps: getCellProps,
              hasActions: true,
              selection,
              isSelectable: true,
            }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  const table = tableRender();

  return (
    <div>
      <EuiPanel paddingSize='m'>{table}</EuiPanel>
      {isEditGroupsVisible ? (
        <EditAgentGroupsModal
          agent={agent}
          reloadAgents={() => reloadAgents()}
          onClose={() => {
            setIsEditGroupsVisible(false);
            setAgent(undefined);
          }}
        />
      ) : null}
    </div>
  );
});

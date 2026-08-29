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

import React, { useState, useEffect } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiCallOut,
  EuiButton,
  EuiSpacer,
} from '@elastic/eui';
import { WzButtonPermissions } from '../../common/permissions/button';
import { withErrorBoundary } from '../../common/hocs';
import {
  UI_ORDER_AGENT_STATUS,
  SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
} from '../../../../common/constants';
import { TableWzAPI } from '../../common/tables';
import { WzRequest } from '../../../react-services/wz-request';
import { get as getLodash } from 'lodash';
import { endpointSummary } from '../../../utils/applications';
import { EditAgentGroupsModal } from './actions/edit-groups-modal';
import { agentsTableColumns } from './columns';
import { AgentsTableGlobalActions } from './global-actions/global-actions';
import { Agent } from '../types';
import { UpgradeAgentModal } from './actions/upgrade-agent-modal';
import NavigationService from '../../../react-services/navigation-service';
import { getWazuhAPIVersion } from '../services';
import { RemoveAgentModal } from './actions/remove-agent-modal';
import { getAgentVersion } from '../../../../common/services/wz-agent';
import { useUpgradeStatus, usePendingUpgradeAgents } from '../hooks';
import { endpointsSummaryI18n } from '../i18n';

type AgentList = {
  items: Agent[];
  totalItems: number;
};

interface AgentsTableProps {
  filters: any;
  externalReload?: boolean;
  setExternalReload?: (newValue: number) => void;
}

export const AgentsTable = withErrorBoundary((props: AgentsTableProps) => {
  const defaultFilters = {
    ...(sessionStorage.getItem('wz-agents-overview-table-filter')
      ? JSON.parse(sessionStorage.getItem('wz-agents-overview-table-filter'))
      : {}),
  };
  const [filters, setFilters] = useState(defaultFilters);
  const [agent, setAgent] = useState<Agent>();
  const [reloadTable, setReloadTable] = useState(0);
  const [agentList, setAgentList] = useState<AgentList>({
    items: [],
    totalItems: 0,
  });
  const [isEditGroupsVisible, setIsEditGroupsVisible] = useState(false);
  const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(false);
  const [isRemoveModalVisible, setIsRemoveModalVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Agent[]>([]);
  const [allAgentsSelected, setAllAgentsSelected] = useState(false);
  const [apiVersion, setApiVersion] = useState('');

  const getApiVersion = async () => {
    const response = await getWazuhAPIVersion('AgentsTable.getApiVersion');
    if (response) {
      setApiVersion(response);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('wz-agents-overview-table-filter')) {
      sessionStorage.removeItem('wz-agents-overview-table-filter');
    }
    getApiVersion();
  }, []);

  useEffect(() => {
    props.filters &&
      Object.keys(props.filters).length &&
      setFilters(props.filters);
  }, [props.filters]);

  const reloadAgents = async () => {
    setSelectedItems([]);
    setAllAgentsSelected(false);
    setReloadTable(Date.now());
    if (props.setExternalReload) {
      props.setExternalReload(Date.now());
    }
  };

  useUpgradeStatus(reloadAgents, reloadTable);
  const pendingUpgradeAgents = usePendingUpgradeAgents();
  const pendingUpgradeAgentIds = new Set(
    pendingUpgradeAgents.map(pendingAgent => pendingAgent.id),
  );

  const onSelectionChange = (selectedItems: Agent[]) => {
    setSelectedItems(selectedItems);
    if (selectedItems.length < agentList.totalItems) {
      setAllAgentsSelected(false);
    }
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
        NavigationService.getInstance().navigate(
          `/agents?tab=welcome&agent=${item.id}`,
        );
      },
    };
  };

  const handleOnClickSelectAllAgents = async () => {
    if (allAgentsSelected) {
      setSelectedItems(agentList.items);
      setAllAgentsSelected(false);
      return;
    }

    setAllAgentsSelected(true);
  };

  const handleOnDataChange = async (data: AgentList) => {
    setAgentList(data);
  };

  const showSelectAllItems =
    (selectedItems.length === agentList.items?.length &&
      selectedItems.length < agentList.totalItems) ||
    allAgentsSelected;

  const totalSelected = allAgentsSelected
    ? agentList.totalItems
    : selectedItems.length;

  const selectedtemsRenderer = (
    <EuiFlexGroup alignItems='center'>
      {selectedItems.length ? (
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems='center' gutterSize='s'>
            <EuiFlexItem grow={false}>
              <EuiCallOut
                size='s'
                title={endpointsSummaryI18n.agentsSelected(totalSelected)}
              />
            </EuiFlexItem>
            {showSelectAllItems ? (
              <EuiFlexItem grow={false}>
                <EuiButton
                  size='s'
                  onClick={handleOnClickSelectAllAgents}
                  color={!allAgentsSelected ? 'primary' : 'danger'}
                >
                  {!allAgentsSelected
                    ? endpointsSummaryI18n.selectAllAgents(agentList.totalItems)
                    : endpointsSummaryI18n.clearAgentsSelected(
                        agentList.totalItems,
                      )}
                </EuiButton>
              </EuiFlexItem>
            ) : null}
          </EuiFlexGroup>
        </EuiFlexItem>
      ) : null}
    </EuiFlexGroup>
  );

  const tableRender = () => {
    // The EuiBasicTable tableLayout is set to "auto" to improve the use of empty space in the component.
    // Previously the tableLayout is set to "fixed" with percentage width for each column, but the use of space was not optimal.
    // Important: If all the columns have the truncateText property set to true, the table cannot adjust properly when the viewport size is small.
    return (
      <EuiFlexGroup className='wz-overflow-auto'>
        <EuiFlexItem>
          <TableWzAPI
            title={endpointsSummaryI18n.agents}
            addOnTitle={selectedtemsRenderer}
            actionButtons={
              <EuiFlexItem grow={false}>
                <WzButtonPermissions
                  buttonType='empty'
                  permissions={[{ action: 'agent:create', resource: '*:*:*' }]}
                  iconType='plusInCircle'
                  href={NavigationService.getInstance().getUrlForApp(
                    endpointSummary.id,
                    {
                      path: `#${endpointSummary.redirectTo()}deploy`,
                    },
                  )}
                >
                  {endpointsSummaryI18n.deployNewAgent}
                </WzButtonPermissions>
              </EuiFlexItem>
            }
            postActionButtons={({ filters }) => (
              <EuiFlexItem grow={false}>
                <AgentsTableGlobalActions
                  selectedAgents={selectedItems}
                  allAgentsSelected={allAgentsSelected}
                  allAgentsCount={agentList.totalItems}
                  filters={filters?.q}
                  reloadAgents={() => reloadAgents()}
                />
              </EuiFlexItem>
            )}
            endpoint={'/agents'}
            tableColumns={agentsTableColumns(
              setAgent,
              setIsEditGroupsVisible,
              setIsUpgradeModalVisible,
              setFilters,
              apiVersion,
              { setIsRemoveModalVisible, pendingUpgradeAgentIds },
            )}
            tableInitialSortingField='id'
            tablePageSizeOptions={[10, 25, 50, 100]}
            saveStateStorage={{
              system: 'localStorage',
              key: 'agents-table',
            }}
            reload={reloadTable}
            setReload={props.setExternalReload}
            mapResponseItem={item => {
              return {
                ...item,
                ...(item.ip ? { ip: item.ip } : { ip: '-' }),
                /*
                  The agent version contains the Wazuh word, this gets the string starting with
                  v<NUMBER><ANYTHING>
                  */
                ...(typeof item.version === 'string'
                  ? { version: getAgentVersion(item.version).raw }
                  : { version: '-' }),
              };
            }}
            rowProps={getRowProps}
            filters={filters}
            onDataChange={handleOnDataChange}
            downloadCsv
            showReload
            showFieldSelector
            searchTable
            searchBarWQL={{
              suggestions: {
                field(currentValue) {
                  return [
                    {
                      label: 'dateAdd',
                      description: endpointsSummaryI18n.filterByRegistrationDate,
                    },
                    { label: 'id', description: endpointsSummaryI18n.filterById },
                    { label: 'ip', description: endpointsSummaryI18n.filterByIp },
                    { label: 'group', description: endpointsSummaryI18n.filterByGroup },
                    {
                      label: 'lastKeepAlive',
                      description: endpointsSummaryI18n.filterByLastKeepAlive,
                    },
                    { label: 'manager', description: endpointsSummaryI18n.filterByManager },
                    { label: 'name', description: endpointsSummaryI18n.filterByName },
                    {
                      label: 'os.name',
                      description: endpointsSummaryI18n.filterByOsName,
                    },
                    {
                      label: 'os.platform',
                      description: endpointsSummaryI18n.filterByOsPlatform,
                    },
                    {
                      label: 'os.version',
                      description: endpointsSummaryI18n.filterByOsVersion,
                    },
                    { label: 'status', description: endpointsSummaryI18n.filterByStatus },
                    { label: 'version', description: endpointsSummaryI18n.filterByVersion },
                  ];
                },
                value: async (currentValue, { field }) => {
                  try {
                    switch (field) {
                      case 'status':
                        return UI_ORDER_AGENT_STATUS.map(status => ({
                          label: status,
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
                                    q: `${field}~${currentValue}`,
                                  }
                                : {
                                    q: ``,
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
                        : endpointsSummaryI18n.invalidDateFormat(value);
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
      {pendingUpgradeAgents.length ? (
        <>
          <EuiCallOut
            title={endpointsSummaryI18n.agentsBeingUpgraded(
              pendingUpgradeAgents.length,
            )}
            color='primary'
            iconType='iInCircle'
          >
            <p>{endpointsSummaryI18n.upgradeRefreshHint}</p>
          </EuiCallOut>
          <EuiSpacer size='m' />
        </>
      ) : null}
      <EuiPanel paddingSize='m'>{table}</EuiPanel>
      {isEditGroupsVisible && agent ? (
        <EditAgentGroupsModal
          agent={agent}
          reloadAgents={() => reloadAgents()}
          onClose={() => {
            setIsEditGroupsVisible(false);
            setAgent(undefined);
          }}
        />
      ) : null}
      {isUpgradeModalVisible && agent ? (
        <UpgradeAgentModal
          agent={agent}
          reloadAgents={() => reloadAgents()}
          onClose={() => {
            setIsUpgradeModalVisible(false);
            setAgent(undefined);
          }}
        />
      ) : null}
      {isRemoveModalVisible && agent ? (
        <RemoveAgentModal
          agent={agent}
          reloadAgents={() => reloadAgents()}
          onClose={() => {
            setIsRemoveModalVisible(false);
            setAgent(undefined);
          }}
        />
      ) : null}
    </div>
  );
});

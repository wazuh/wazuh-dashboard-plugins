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
} from '@elastic/eui';
import { WzButtonPermissions } from '../../common/permissions/button';
import { withErrorBoundary } from '../../common/hocs';
import {
  UI_ORDER_AGENT_STATUS,
  AGENT_SYNCED_STATUS,
  SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
  UI_LOGGER_LEVELS,
} from '../../../../common/constants';
import { TableWzAPI } from '../../common/tables';
import { WzRequest } from '../../../react-services/wz-request';
import { get as getLodash } from 'lodash';
import { endpointSummary } from '../../../utils/applications';
import { EditAgentGroupsModal } from './actions/edit-groups-modal';
import { useUserPermissionsRequirements } from '../../common/hooks/useUserPermissions';
import { compose } from 'redux';
import { agentsTableColumns } from './columns';
import { AgentsTableGlobalActions } from './global-actions/global-actions';
import { Agent } from '../types';
import { UpgradeAgentModal } from './actions/upgrade-agent-modal';
import { getOutdatedAgents } from '../services';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { AgentUpgradesInProgress } from './upgrades-in-progress/upgrades-in-progress';
import { AgentUpgradesTaskDetailsModal } from './upgrade-task-details-modal';
import { WzButton } from '../../common/buttons';
import NavigationService from '../../../react-services/navigation-service';

const searchBarWQLOptions = {
  implicitQuery: {
    query: 'id!=000',
    conjunction: ';',
  },
};

type AgentList = {
  items: Agent[];
  totalItems: number;
};

interface AgentsTableProps {
  filters: any;
  externalReload?: boolean;
  showOnlyOutdated: boolean;
  setShowOnlyOutdated: (newValue: boolean) => void;
  totalOutdated?: number;
  setExternalReload?: (newValue: number) => void;
}

export const AgentsTable = withErrorBoundary((props: AgentsTableProps) => {
  const defaultFilters = {
    default: { q: 'id!=000' },
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
  const [selectedItems, setSelectedItems] = useState<Agent[]>([]);
  const [allAgentsSelected, setAllAgentsSelected] = useState(false);
  const [denyEditGroups] = useUserPermissionsRequirements([
    { action: 'group:modify_assignments', resource: 'group:id:*' },
  ]);
  const [denyUpgrade] = useUserPermissionsRequirements([
    { action: 'agent:upgrade', resource: 'agent:id:*' },
  ]);
  const [denyGetTasks] = useUserPermissionsRequirements([
    { action: 'task:status', resource: '*:*:*' },
  ]);

  const [outdatedAgents, setOutdatedAgents] = useState<Agent[]>([]);
  const [isUpgradeTasksModalVisible, setIsUpgradeTasksModalVisible] =
    useState(false);
  const [isUpgradePanelClosed, setIsUpgradePanelClosed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('wz-agents-overview-table-filter')) {
      sessionStorage.removeItem('wz-agents-overview-table-filter');
    }
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

    const agentIds = data?.items?.map(agent => agent.id);

    try {
      const outdatedAgents = agentIds?.length
        ? (await getOutdatedAgents({ agentIds })).affected_items
        : [];
      setOutdatedAgents(outdatedAgents);
    } catch (error) {
      setOutdatedAgents([]);
      const options = {
        context: `AgentsTable.getOutdatedAgents`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error,
          message: error.message || error,
          title: `Could not get outdated agents`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
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
                title={`${totalSelected} ${
                  totalSelected === 1 ? 'agent' : 'agents'
                } selected`}
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
                    ? `Select all ${agentList.totalItems} agents`
                    : `Clear ${agentList.totalItems} agents selected`}
                </EuiButton>
              </EuiFlexItem>
            ) : null}
          </EuiFlexGroup>
        </EuiFlexItem>
      ) : null}
      <EuiFlexItem grow={false}>
        <WzButton
          buttonType='switch'
          label='Show only outdated'
          checked={props.showOnlyOutdated}
          disabled={!props.totalOutdated}
          tooltip={
            !props.totalOutdated && {
              content: 'There are no outdated agents',
            }
          }
          onChange={() => props.setShowOnlyOutdated(!props.showOnlyOutdated)}
        />
      </EuiFlexItem>
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
            title='Agents'
            addOnTitle={selectedtemsRenderer}
            extra={
              <AgentUpgradesInProgress
                reload={props.externalReload}
                setIsModalVisible={setIsUpgradeTasksModalVisible}
                isPanelClosed={isUpgradePanelClosed}
                setIsPanelClosed={setIsUpgradePanelClosed}
                allowGetTasks={!denyGetTasks}
              />
            }
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
                  Deploy new agent
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
                  allowEditGroups={!denyEditGroups}
                  allowUpgrade={!denyUpgrade}
                  allowGetTasks={!denyGetTasks}
                  reloadAgents={() => reloadAgents()}
                  setIsUpgradeTasksModalVisible={setIsUpgradeTasksModalVisible}
                  setIsUpgradePanelClosed={setIsUpgradePanelClosed}
                />
              </EuiFlexItem>
            )}
            endpoint={props.showOnlyOutdated ? '/agents/outdated' : '/agents'}
            tableColumns={agentsTableColumns(
              !denyEditGroups,
              !denyUpgrade,
              setAgent,
              setIsEditGroupsVisible,
              setIsUpgradeModalVisible,
              setFilters,
              outdatedAgents,
            )}
            tableInitialSortingField='id'
            tablePageSizeOptions={[10, 25, 50, 100]}
            reload={reloadTable}
            setReload={props.setExternalReload}
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
            onDataChange={handleOnDataChange}
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
                    { label: 'id', description: 'filter by ID' },
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
          setIsUpgradePanelClosed={setIsUpgradePanelClosed}
        />
      ) : null}
      {isUpgradeTasksModalVisible ? (
        <AgentUpgradesTaskDetailsModal
          onClose={() => setIsUpgradeTasksModalVisible(false)}
        />
      ) : null}
    </div>
  );
});

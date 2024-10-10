/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { EuiCallOut, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

import { connect } from 'react-redux';
import GroupsHandler from './utils/groups-handler';
import { getToasts } from '../../../../../kibana-services';
import {
  updateLoadingStatus,
  updateFileContent,
  updateIsProcessing,
  updatePageIndexAgents,
  updateShowModal,
  updateListItemsForRemove,
  updateSortDirectionAgents,
  updateSortFieldAgents,
  updateReload,
} from '../../../../../redux/actions/groupsActions';
import { TableWzAPI } from '../../../../../components/common/tables';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';
import { WzButtonPermissionsModalConfirm } from '../../../../../components/common/buttons';
import {
  SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
  UI_LOGGER_LEVELS,
} from '../../../../../../common/constants';
import { get as getLodash } from 'lodash';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import { AgentStatus } from '../../../../../components/agents/agent-status';
import { WzRequest } from '../../../../../react-services';
import { endpointSummary } from '../../../../../utils/applications';
import NavigationService from '../../../../../react-services/navigation-service';

class WzGroupAgentsTable extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);

    this.columns = [
      {
        field: 'id',
        name: 'Id',
        align: 'left',
        searchable: true,
        sortable: true,
      },
      {
        field: 'name',
        name: 'Name',
        align: 'left',
        searchable: true,
        sortable: true,
      },
      {
        field: 'ip',
        name: 'IP address',
        align: 'left',
        searchable: true,
        sortable: true,
      },
      {
        field: 'os.name,os.version',
        composeField: ['os.name', 'os.version'],
        name: 'Operating system',
        align: 'left',
        searchable: true,
        sortable: true,
        render: (field, agentData) => this.addIconPlatformRender(agentData),
      },
      {
        field: 'version',
        name: 'Version',
        align: 'left',
        searchable: true,
        sortable: true,
      },
      {
        field: 'status',
        name: 'Status',
        align: 'left',
        searchable: true,
        sortable: true,
        render: (status, agent) => (
          <AgentStatus
            status={status}
            agent={agent}
            labelProps={{ className: 'hide-agent-status' }}
          />
        ),
      },
      {
        name: 'Actions',
        align: 'left',
        searchable: false,
        render: item => {
          return (
            <div>
              <WzButtonPermissions
                buttonType='icon'
                permissions={[
                  [
                    { action: 'agent:read', resource: `agent:id:${item.id}` },
                    ...(item.group || []).map(group => ({
                      action: 'agent:read',
                      resource: `agent:group:${group}`,
                    })),
                  ],
                ]}
                tooltip={{ position: 'top', content: 'Go to the agent' }}
                aria-label='Go to the agent'
                iconType='eye'
                onClick={async () => {
                  NavigationService.getInstance().navigateToApp(
                    endpointSummary.id,
                    {
                      path: `#/agents?agent=${item.id}`,
                    },
                  );
                }}
                color='primary'
              />
              {this.props?.state?.itemDetail?.name !== 'default' && (
                <WzButtonPermissionsModalConfirm
                  buttonType='icon'
                  permissions={[
                    [
                      {
                        action: 'agent:modify_group',
                        resource: `agent:id:${item.id}`,
                      },
                      ...(item.group || []).map(group => ({
                        action: 'agent:modify_group',
                        resource: `agent:group:${group}`,
                      })),
                    ],
                  ]}
                  tooltip={{
                    position: 'top',
                    content: 'Remove agent from this group',
                  }}
                  aria-label='Remove agent from this group'
                  iconType='trash'
                  onConfirm={async () => {
                    this.removeItems([item]);
                  }}
                  color='danger'
                  isDisabled={item.name === 'default'}
                  modalTitle={`Remove ${
                    item.file || item.name
                  } agent from this group?`}
                  modalProps={{
                    buttonColor: 'danger',
                  }}
                />
              )}
            </div>
          );
        },
      },
    ];

    this.searchBar = {
      wql: {
        suggestionFields: [
          { label: 'id', description: `filter by ID` },
          { label: 'ip', description: `filter by IP address` },
          { label: 'name', description: `filter by Name` },
          { label: 'os.name', description: `filter by Operating system name` },
          {
            label: 'os.version',
            description: `filter by Operating system version`,
          },
          { label: 'status', description: `filter by Status` },
          { label: 'version', description: `filter by Version` },
        ],
      },
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  addIconPlatformRender(agent) {
    let icon = '';
    const os = agent?.os || {};

    if ((os?.uname || '').includes('Linux')) {
      icon = 'linux';
    } else if (os?.platform === 'windows') {
      icon = 'windows';
    } else if (os?.platform === 'darwin') {
      icon = 'apple';
    }
    const os_name = `${agent?.os?.name || ''} ${agent?.os?.version || ''}`;

    return (
      <EuiFlexGroup gutterSize='xs'>
        <EuiFlexItem grow={false}>
          <i
            className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${icon}`}
            aria-hidden='true'
          ></i>
        </EuiFlexItem>{' '}
        <EuiFlexItem>{os_name.trim() || '-'}</EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  render() {
    const { error } = this.props.state;
    const groupName = this.props.state?.itemDetail?.name;
    const searchBarSuggestionsFields = this.searchBar.wql.suggestionFields;
    if (!error) {
      return (
        <TableWzAPI
          title='Agents'
          description='From here you can list and manage your agents'
          tableColumns={this.columns}
          tableInitialSortingField='id'
          endpoint={`/groups/${groupName}/agents`}
          searchBarWQL={{
            suggestions: {
              field: () => searchBarSuggestionsFields,
              value: async (currentValue, { field }) => {
                try {
                  const response = await WzRequest.apiReq(
                    'GET',
                    `/groups/${groupName}/agents`,
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
          mapResponseItem={item => ({
            ...item,
            ...(item.ip ? { ip: item.ip } : { ip: '-' }),
            ...(typeof item.version === 'string'
              ? { version: item.version.match(/(v\d.+)/)?.[1] }
              : { version: '-' }),
          })}
          showReload
          downloadCsv={`agents-group-${groupName}`}
          reload={this.props.state.reload}
          searchTable={true}
          tableProps={{ tableLayout: 'auto' }}
        />
      );
    } else {
      return <EuiCallOut color='warning' title={error} iconType='gear' />;
    }
  }

  showToast = (color, title, text, time) => {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  async removeItems(items) {
    const { itemDetail } = this.props.state;
    this.props.updateLoadingStatus(true);
    try {
      await Promise.all(
        items.map(item => GroupsHandler.deleteAgent(item.id, itemDetail.name)),
      );
      this.props.updateIsProcessing(true);
      this.props.updateLoadingStatus(false);
      this.props.updateReload();
      this.showToast('success', 'Success', 'Deleted successfully', 3000);
    } catch (error) {
      const options = {
        context: `${WzGroupAgentsTable.name}.removeItems`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: error.title || error,
        },
      };
      getErrorOrchestrator().handleError(options);
      this.props.updateIsProcessing(true);
      this.props.updateLoadingStatus(false);
      this.props.updateReload();
    }
  }
}

const mapStateToProps = state => {
  return {
    state: state.groupsReducers,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    updateFileContent: content => dispatch(updateFileContent(content)),
    updateIsProcessing: isProcessing =>
      dispatch(updateIsProcessing(isProcessing)),
    updatePageIndexAgents: pageIndexAgents =>
      dispatch(updatePageIndexAgents(pageIndexAgents)),
    updateShowModal: showModal => dispatch(updateShowModal(showModal)),
    updateListItemsForRemove: itemList =>
      dispatch(updateListItemsForRemove(itemList)),
    updateSortDirectionAgents: sortDirectionAgents =>
      dispatch(updateSortDirectionAgents(sortDirectionAgents)),
    updateSortFieldAgents: sortFieldAgents =>
      dispatch(updateSortFieldAgents(sortFieldAgents)),
    updateReload: () => dispatch(updateReload()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzGroupAgentsTable);

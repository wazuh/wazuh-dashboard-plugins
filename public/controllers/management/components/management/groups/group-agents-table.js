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
import { EuiCallOut } from '@elastic/eui';

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

import { getAgentFilterValues } from './get-agents-filters-values';
import { TableWzAPI } from '../../../../../components/common/tables';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';
import { WzButtonPermissionsModalConfirm } from '../../../../../components/common/buttons';
import {
  UI_LOGGER_LEVELS,
  UI_ORDER_AGENT_STATUS,
} from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import { i18n } from '@kbn/i18n';

class WzGroupAgentsTable extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.suggestions = [
      {
        type: 'q',
        label: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.status1',
          {
            defaultMessage: 'status',
          },
        ),
        description: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.status',
          {
            defaultMessage: 'Filter by agent connection status',
          },
        ),
        operators: ['=', '!='],
        values: UI_ORDER_AGENT_STATUS,
      },
      {
        type: 'q',
        label: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.os.platform',
          {
            defaultMessage: 'os.platform',
          },
        ),
        description: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.FilterbyOSplatform',
          {
            defaultMessage: 'Filter by OS platform',
          },
        ),
        operators: ['=', '!='],
        values: async value =>
          getAgentFilterValues('os.platform', value, {
            q: `group=${this.props.state.itemDetail.name}`,
          }),
      },
      {
        type: 'q',
        label: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.ip',
          {
            defaultMessage: 'ip',
          },
        ),
        description: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.FilterbyagentIP',
          {
            defaultMessage: 'Filter by agent IP',
          },
        ),
        operators: ['=', '!='],
        values: async value =>
          getAgentFilterValues('ip', value, {
            q: `group=${this.props.state.itemDetail.name}`,
          }),
      },
      {
        type: 'q',
        label: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.name',
          {
            defaultMessage: 'name',
          },
        ),
        description: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.Filterbyagentname',
          {
            defaultMessage: 'Filter by agent name',
          },
        ),
        operators: ['=', '!='],
        values: async value =>
          getAgentFilterValues('name', value, {
            q: `group=${this.props.state.itemDetail.name}`,
          }),
      },
      {
        type: 'q',
        label: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.id',
          {
            defaultMessage: 'id',
          },
        ),
        description: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.Filterbyagentid',
          {
            defaultMessage: 'Filter by agent id',
          },
        ),
        operators: ['=', '!='],
        values: async value =>
          getAgentFilterValues('id', value, {
            q: `group=${this.props.state.itemDetail.name}`,
          }),
      },
      {
        type: 'q',
        label: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.node_name',
          {
            defaultMessage: 'node_name',
          },
        ),
        description: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.nodeName',
          {
            defaultMessage: 'Filter by node name',
          },
        ),
        operators: ['=', '!='],
        values: async value =>
          getAgentFilterValues('node_name', value, {
            q: `group=${this.props.state.itemDetail.name}`,
          }),
      },
      {
        type: 'q',
        label: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.',
          {
            defaultMessage: 'manager',
          },
        ),
        description: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.Filterbymanager',
          {
            defaultMessage: 'Filter by manager',
          },
        ),
        operators: ['=', '!='],
        values: async value =>
          getAgentFilterValues('manager', value, {
            q: `group=${this.props.state.itemDetail.name}`,
          }),
      },
      {
        type: 'q',
        label: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.version',
          {
            defaultMessage: 'version',
          },
        ),
        description: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.Filterbyagentversion',
          {
            defaultMessage: 'Filter by agent version',
          },
        ),
        operators: ['=', '!='],
        values: async value =>
          getAgentFilterValues('version', value, {
            q: `group=${this.props.state.itemDetail.name}`,
          }),
      },
      {
        type: 'q',
        label: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.configSum1',
          {
            defaultMessage: 'configSum',
          },
        ),
        description: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.configSum',
          {
            defaultMessage: 'Filter by agent config sum',
          },
        ),
        operators: ['=', '!='],
        values: async value =>
          getAgentFilterValues('configSum', value, {
            q: `group=${this.props.state.itemDetail.name}`,
          }),
      },
      {
        type: 'q',
        label: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.mergedSum',
          {
            defaultMessage: 'mergedSum',
          },
        ),
        description: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.filter',
          {
            defaultMessage: 'Filter by agent merged sum',
          },
        ),
        operators: ['=', '!='],
        values: async value =>
          getAgentFilterValues('mergedSum', value, {
            q: `group=${this.props.state.itemDetail.name}`,
          }),
      },
      //{ type: 'q', label: 'dateAdd', description: 'Filter by add date', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('dateAdd', value,  {q: `group=${this.props.state.itemDetail.name}`})},
      //{ type: 'q', label: 'lastKeepAlive', description: 'Filter by last keep alive', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('lastKeepAlive', value,  {q: `group=${this.props.state.itemDetail.name}`})},
    ];
    this.groupsHandler = GroupsHandler;

    this.columns = [
      {
        field: 'id',
        name: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.Id',
          {
            defaultMessage: 'Id',
          },
        ),
        align: 'left',
        sortable: true,
      },
      {
        field: 'name',
        name: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.Name',
          {
            defaultMessage: 'Name',
          },
        ),
        align: 'left',
        sortable: true,
      },
      {
        field: 'ip',
        name: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.Ip',
          {
            defaultMessage: 'Ip',
          },
        ),
        align: 'left',
        sortable: true,
      },
      {
        field: 'status',
        name: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.Status',
          {
            defaultMessage: 'Status',
          },
        ),
        align: 'left',
        sortable: true,
      },
      {
        field: 'os.name',
        name: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.Osname',
          {
            defaultMessage: 'Os name',
          },
        ),
        align: 'left',
        sortable: true,
      },
      {
        field: 'os.version',
        name: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.Osversion',
          {
            defaultMessage: 'Os version',
          },
        ),
        align: 'left',
        sortable: true,
      },
      {
        field: 'version',
        name: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.Version',
          {
            defaultMessage: 'Version',
          },
        ),
        align: 'left',
        sortable: true,
      },
      {
        name: i18n.translate(
          'wazuh.public.controller.management.groups.agents.table.Actions',
          {
            defaultMessage: 'Actions',
          },
        ),
        align: 'left',
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
                tooltip={{
                  position: 'top',
                  content: i18n.translate(
                    'wazuh.public.controller.management.groups.agents.table.Gototheagent',
                    {
                      defaultMessage: 'Go to the agent',
                    },
                  ),
                }}
                aria-label={i18n.translate(
                  'wazuh.public.controller.management.groups.agents.table.Gototheagent',
                  {
                    defaultMessage: 'Go to the agent',
                  },
                )}
                iconType='eye'
                onClick={async () => {
                  this.props.groupsProps.showAgent(item);
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
                    content: i18n.translate(
                      'wazuh.public.controller.management.groups.agents.table.thisGroup',
                      {
                        defaultMessage: 'Remove agent from this group',
                      },
                    ),
                  }}
                  aria-label={i18n.translate(
                    'wazuh.public.controller.management.groups.agents.table.fromGrop',
                    {
                      defaultMessage: 'Remove agent from this group',
                    },
                  )}
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
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { error } = this.props.state;
    if (!error) {
      return (
        <TableWzAPI
          tableColumns={this.columns}
          tableInitialSortingField='id'
          searchBarSuggestions={this.suggestions}
          endpoint={`/groups/${this.props.state.itemDetail.name}/agents`}
          reload={this.props.state.reload}
          searchTable={true}
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
        items.map(item =>
          this.groupsHandler.deleteAgent(item.id, itemDetail.name),
        ),
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

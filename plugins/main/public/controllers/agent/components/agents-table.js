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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  EuiButton,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiToolTip,
  EuiIconTip,
} from '@elastic/eui';
import { AppNavigate } from '../../../react-services/app-navigate';
import { GroupTruncate } from '../../../components/common/util';
import { WzButtonPermissions } from '../../../components/common/permissions/button';
import { formatUIDate } from '../../../react-services/time-service';
import { withErrorBoundary } from '../../../components/common/hocs';
import {
  API_NAME_AGENT_STATUS,
  UI_ORDER_AGENT_STATUS,
  AGENT_SYNCED_STATUS,
} from '../../../../common/constants';
import { AgentStatus } from '../../../components/agents/agent_status';
import { AgentSynced } from '../../../components/agents/agent-synced';
import { TableWzAPI } from '../../../components/common/tables';
import { WzRequest } from '../../../react-services/wz-request';
import { get as getLodash } from 'lodash';

const searchBarWQLOptions = {
  implicitQuery: {
    query: 'id!=000',
    conjunction: ';',
  },
};

export const AgentsTable = withErrorBoundary(
  class AgentsTable extends Component {
    _isMount = false;
    constructor(props) {
      super(props);
      this.state = {
        filters: {
          default: { q: 'id!=000' },
          ...(sessionStorage.getItem('wz-agents-overview-table-filter')
            ? JSON.parse(
                sessionStorage.getItem('wz-agents-overview-table-filter'),
              )
            : {}),
        },
        reloadTable: 0,
      };
    }

    async componentDidMount() {
      this._isMount = true;
    }

    componentWillUnmount() {
      this._isMount = false;
      if (sessionStorage.getItem('wz-agents-overview-table-filter')) {
        sessionStorage.removeItem('wz-agents-overview-table-filter');
      }
    }

    async reloadAgents() {
      this.setState({ reloadTable: Date.now() });
      await this.props.reload();
    }

    async componentDidUpdate(prevProps) {
      if (
        // TODO: external filters
        !_.isEqual(prevProps.filters, this.props.filters)
      ) {
        this.setState({ filters: this.props.filters });
      }
    }

    actionButtonsRender(agent) {
      return (
        <div className={'icon-box-action'}>
          <EuiToolTip
            content='Open summary panel for this agent'
            position='left'
          >
            <EuiButtonIcon
              onClick={ev => {
                ev.stopPropagation();
                AppNavigate.navigateToModule(ev, 'agents', {
                  tab: 'welcome',
                  agent: agent.id,
                });
              }}
              iconType='eye'
              color={'primary'}
              aria-label='Open summary panel for this agent'
            />
          </EuiToolTip>
          &nbsp;
          {agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED && (
            <EuiToolTip
              content='Open configuration for this agent'
              position='left'
            >
              <EuiButtonIcon
                onClick={ev => {
                  ev.stopPropagation();
                  AppNavigate.navigateToModule(ev, 'agents', {
                    tab: 'configuration',
                    agent: agent.id,
                  });
                }}
                color={'primary'}
                iconType='wrench'
                aria-label='Open configuration for this agent'
              />
            </EuiToolTip>
          )}
        </div>
      );
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

    // Columns with the property truncateText: true won't wrap the text
    // This is added to prevent the wrap because of the table-layout: auto
    defaultColumns = [
      {
        field: 'id',
        name: 'ID',
        sortable: true,
        show: true,
        searchable: true,
      },
      {
        field: 'name',
        name: 'Name',
        sortable: true,
        show: true,
        searchable: true,
      },
      {
        field: 'ip',
        name: 'IP address',
        sortable: true,
        show: true,
        searchable: true,
      },
      {
        field: 'group',
        name: 'Group(s)',
        sortable: true,
        show: true,
        render: groups => (groups !== '-' ? this.renderGroups(groups) : '-'),
        searchable: true,
      },
      {
        field: 'os.name,os.version',
        composeField: ['os.name', 'os.version'],
        name: 'Operating system',
        sortable: true,
        show: true,
        render: (field, agentData) => this.addIconPlatformRender(agentData),
        searchable: true,
      },
      {
        field: 'node_name',
        name: 'Cluster node',
        sortable: true,
        show: true,
        searchable: true,
      },
      {
        field: 'version',
        name: 'Version',
        sortable: true,
        show: true,
        searchable: true,
      },
      {
        field: 'dateAdd',
        name: (
          <span>
            Registration date{' '}
            <EuiIconTip
              content='This is not searchable through a search term.'
              size='s'
              color='subdued'
              type='alert'
            />
          </span>
        ),
        sortable: true,
        show: false,
        searchable: false,
      },
      {
        field: 'lastKeepAlive',
        name: (
          <span>
            Last keep alive{' '}
            <EuiIconTip
              content='This is not searchable through a search term.'
              size='s'
              color='subdued'
              type='alert'
            />
          </span>
        ),
        sortable: true,
        show: false,
        searchable: false,
      },
      {
        field: 'status',
        name: 'Status',
        truncateText: true,
        sortable: true,
        show: true,
        render: status => (
          <AgentStatus
            status={status}
            labelProps={{ className: 'hide-agent-status' }}
          />
        ),
        searchable: true,
      },
      {
        field: 'group_config_status',
        name: 'Synced',
        sortable: true,
        show: false,
        render: synced => <AgentSynced synced={synced} />,
        searchable: true,
      },
      {
        align: 'right',
        width: '5%',
        field: 'actions',
        name: 'Actions',
        show: true,
        render: (field, agentData) => this.actionButtonsRender(agentData),
        searchable: false,
      },
    ];

    tableRender() {
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
            AppNavigate.navigateToModule(ev, 'agents', {
              tab: 'welcome',
              agent: item.id,
            });
            ev.stopPropagation();
          },
        };
      };

      // The EuiBasicTable tableLayout is set to "auto" to improve the use of empty space in the component.
      // Previously the tableLayout is set to "fixed" with percentage width for each column, but the use of space was not optimal.
      // Important: If all the columns have the truncateText property set to true, the table cannot adjust properly when the viewport size is small.
      return (
        <EuiFlexGroup className='wz-overflow-auto'>
          <EuiFlexItem>
            <TableWzAPI
              title='Agents'
              actionButtons={[
                <WzButtonPermissions
                  buttonType='empty'
                  permissions={[{ action: 'agent:create', resource: '*:*:*' }]}
                  iconType='plusInCircle'
                  onClick={() => this.props.addingNewAgent()}
                >
                  Deploy new agent
                </WzButtonPermissions>,
              ]}
              endpoint='/agents'
              tableColumns={this.defaultColumns}
              tableInitialSortingField='id'
              tablePageSizeOptions={[10, 25, 50, 100]}
              reload={this.state.reloadTable}
              mapResponseItem={item => {
                return {
                  ...item,
                  ...(item.ip ? { ip: item.ip } : { ip: '-' }),
                  ...(typeof item.dateAdd === 'string'
                    ? { dateAdd: formatUIDate(item.dateAdd) }
                    : { dateAdd: '-' }),
                  ...(typeof item.lastKeepAlive === 'string'
                    ? { lastKeepAlive: formatUIDate(item.lastKeepAlive) }
                    : { lastKeepAlive: '-' }),
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
              filters={this.state.filters}
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
                        description: 'filter by synced',
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
                                limit: 30,
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
              searchBarProps={{
                buttonsRender: () => (
                  <EuiButton
                    iconType='refresh'
                    fill={true}
                    onClick={() => this.reloadAgents()}
                  >
                    Refresh
                  </EuiButton>
                ),
              }}
              saveStateStorage={{
                system: 'localStorage',
                key: 'wz-agents-overview-table',
              }}
              tableProps={{
                tableLayout: 'auto',
                getCellProps,
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }

    filterGroupBadge = group => {
      this.setState({
        filters: {
          default: { q: 'id!=000' },
          q: `id!=000;group=${group}`,
        },
      });
    };

    renderGroups(groups) {
      return Array.isArray(groups) ? (
        <GroupTruncate
          groups={groups}
          length={25}
          label={'more'}
          action={'filter'}
          filterAction={this.filterGroupBadge}
          {...this.props}
        />
      ) : undefined;
    }
    render() {
      const table = this.tableRender();

      return (
        <div>
          <EuiPanel paddingSize='m'>{table}</EuiPanel>
        </div>
      );
    }
  },
);

AgentsTable.propTypes = {
  wzReq: PropTypes.func,
  addingNewAgent: PropTypes.func,
  downloadCsv: PropTypes.func,
  timeService: PropTypes.func,
  reload: PropTypes.func,
};

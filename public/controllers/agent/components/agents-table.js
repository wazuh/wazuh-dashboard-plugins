/*
 * Wazuh app - React component for building the agents table.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiToolTip,
  EuiTitle,
  EuiHealth,
  EuiSpacer
} from '@elastic/eui';
import { WzFilterBar } from '../../../components/wz-filter-bar/wz-filter-bar';

export class AgentsTable extends Component {
  _isMount = false;
  constructor(props) {
    super(props);
    const selectedOptions = JSON.parse(
      sessionStorage.getItem('agents_preview_selected_options')
    );
    this.state = {
      agents: [],
      isLoading: false,
      isProcessing: true,
      pageIndex: 0,
      pageSize: 15,
      q: '',
      search: '',
      selectedOptions: selectedOptions || [],
      sortDirection: 'asc',
      sortField: 'id',
      totalItems: 0
    };
    this.downloadCsv.bind(this);
  }

  async componentDidMount() {
    this._isMount = true;
    await this.getItems();
    const filterStatus = this.filterBarModelStatus();
    const filterGroups = await this.filterBarModelGroups();
    const filterOs = await this.filterBarModelOs();
    const filterVersion = await this.filterBarModelWazuhVersion();
    const filterOsPlatform = await this.filterBarModelOsPlatform();
    const filterNodes = await this.filterBarModelNodes();
    this._isMount &&
      this.setState({
        filterStatus,
        filterGroups,
        filterOs,
        filterVersion,
        filterOsPlatform,
        filterNodes
      });
  }

  async componentDidUpdate(prevProps, prevState) {
    if (this.state.isProcessing) {
      const { q, search } = this.state;
      const { q: prevQ, search: prevSearch } = prevState;
      if (prevQ !== q || prevSearch !== search) {
        this._isMount && this.setState({ pageIndex: 0 });
      }
      await this.getItems();
    }
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndex, size: pageSize } = page;
    const { field: sortField, direction: sortDirection } = sort;
    this.setState({
      pageIndex,
      pageSize,
      sortField,
      sortDirection,
      isProcessing: true,
      isLoading: true
    });
  };

  onQueryChange = ({ q = {}, search = {}, selectedOptions = {} }) => {
    sessionStorage.setItem(
      'agents_preview_selected_options',
      JSON.stringify(selectedOptions)
    );
    this.setState({
      q,
      search,
      selectedOptions,
      isProcessing: true,
      isLoading: true
    });
  };

  async reloadAgents() {
    this._isMount &&
      this.setState({
        isProcessing: true,
        isLoading: true
      });
    await this.props.reload();
  }

  async getItems() {
    const rawAgents = await this.props.wzReq(
      'GET',
      '/agents',
      this.buildFilter()
    );

    const formatedAgents = (
      ((rawAgents || {}).data || {}).data || {}
    ).items.map(this.formatAgent.bind(this));
    this._isMount &&
      this.setState({
        agents: formatedAgents,
        totalItems: (((rawAgents || {}).data || {}).data || {}).totalItems,
        isProcessing: false,
        isLoading: false
      });
  }

  buildFilter() {
    const { pageIndex, pageSize, search } = this.state;

    const filter = {
      offset: pageIndex * pageSize,
      limit: pageSize,
      q: this.buildQFilter(),
      sort: this.buildSortFilter()
    };

    if (search !== '') {
      filter.search = search;
    }
    return filter;
  }

  buildSortFilter() {
    const { sortField, sortDirection } = this.state;

    const field = sortField === 'os_name' ? '' : sortField;
    const direction = sortDirection === 'asc' ? '+' : '-';

    return direction + field;
  }

  buildQFilter() {
    const { q } = this.state;
    return q === '' ? `id!=000` : `id!=000;${q}`;
  }

  formatAgent(agent) {
    const checkField = field => {
      return field !== undefined ? field : '-';
    };
    const lastKeepAlive = (date, timeService) => {
      return date !== undefined ? timeService(date) : '-';
    };
    const agentVersion =
      agent.version !== undefined ? agent.version.split(' ')[1] : '.';
    const { timeService } = this.props;
    return {
      id: agent.id,
      name: agent.name,
      ip: agent.ip,
      status: agent.status,
      group: checkField(agent.group),
      os_name: agent,
      version: agentVersion,
      dateAdd: timeService(agent.dateAdd),
      lastKeepAlive: lastKeepAlive(agent.lastKeepAlive, timeService),
      actions: agent
    };
  }

  actionButtonsRender(agent) {
    return (
      <div>
        <EuiToolTip
          content="Open Overview panel for this agent"
          position="left"
        >
          <EuiButtonIcon
            onClick={() => ev => {
              ev.stopPropagation();
              this.props.clickAction(agent, 'discover');
            }}
            iconType="eye"
            color={'primary'}
            aria-label="Open Overview panel for this agent"
          />
        </EuiToolTip>
        &nbsp;
        <EuiToolTip content="Open configuration for this agent" position="left">
          <EuiButtonIcon
            onClick={ev => {
              ev.stopPropagation();
              this.props.clickAction(agent, 'configuration');
            }}
            color={'primary'}
            iconType="wrench"
            aria-label="Open configuration for this agent"
          />
        </EuiToolTip>
        {/*         <EuiToolTip content="Restart agent" position="left">
          <EuiButtonIcon
            onClick={() => this.props.clickAction(agent, 'configuration')}
            color={'primary'}
            iconType="refresh"
            aria-label="Restart agent"
          />
        </EuiToolTip> */}
        {/*         <EuiToolTip content="Upgrade agent" position="left">
          <EuiButtonIcon
            onClick={() => this.props.clickAction(agent, 'configuration')}
            color={'success'}
            iconType="sortUp"
            aria-label="Upgrade agent"
          />
        </EuiToolTip> */}
        {/*         <EuiToolTip content="Delete this agent" position="left">
          <EuiButtonIcon
            onClick={() => this.props.clickAction(agent, 'configuration')}
            color={'danger'}
            iconType="trash"
            aria-label="Delete this agent"
          />
        </EuiToolTip> */}
      </div>
    );
  }

  addIconPlatformRender(agent) {
    let icon = false;
    const checkField = field => {
      return field !== undefined ? field : '-';
    };
    const os = (agent || {}).os;

    if (((os || {}).uname || '').includes('Linux')) {
      icon = 'linux';
    } else if ((os || {}).platform === 'windows') {
      icon = 'windows';
    } else if ((os || {}).platform === 'darwin') {
      icon = 'apple';
    }
    const os_name =
      checkField(((agent || {}).os || {}).name) +
      ' ' +
      checkField(((agent || {}).os || {}).version);

    return (
      <span className="euiTableCellContent__text euiTableCellContent--truncateText">
        <i
          className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${icon}`}
          aria-hidden="true"
        ></i>{' '}
        {os_name === '--' ? '-' : os_name}
      </span>
    );
  }

  addHealthStatusRender(status) {
    const color = status => {
      if (status.toLowerCase() === 'active') {
        return 'success';
      } else if (status.toLowerCase() === 'disconnected') {
        return 'danger';
      } else if (status.toLowerCase() === 'never connected') {
        return 'subdued';
      }
    };

    return <EuiHealth color={color(status)}>{status}</EuiHealth>;
  }

  downloadCsv = () => {
    const { q, search = {} } = this.buildFilter();
    const filterQ = { name: 'q', value: q };
    const filterSearch = { name: 'search', value: search };
    this.props.downloadCsv([filterQ, filterSearch]);
  };
  formattedButton() {
    return (
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty iconType="importAction" onClick={this.downloadCsv}>
          Export formatted
        </EuiButtonEmpty>
      </EuiFlexItem>
    );
  }

  columns() {
    return [
      {
        field: 'id',
        name: 'ID',
        sortable: true,
        width: '65px'
      },
      {
        field: 'name',
        name: 'Name',
        sortable: true,
        truncateText: true
      },
      {
        field: 'ip',
        name: 'IP',
        truncateText: true,
        sortable: true
      },
      {
        field: 'group',
        name: 'Group(s)',
        truncateText: true,
        sortable: true
      },
      {
        field: 'os_name',
        name: 'OS',
        sortable: true,
        truncateText: true,
        render: this.addIconPlatformRender
      },
      {
        field: 'version',
        name: 'Version',
        width: '100px',
        truncateText: true,
        sortable: true
      },
      {
        field: 'dateAdd',
        name: 'Registration date',
        truncateText: true,
        sortable: true
      },
      {
        field: 'lastKeepAlive',
        name: 'Last keep alive',
        truncateText: true,
        sortable: true
      },
      {
        field: 'status',
        name: 'Status',
        truncateText: true,
        sortable: true,
        render: this.addHealthStatusRender
      },
      {
        align: 'right',
        width: '100px',
        field: 'actions',
        name: 'Actions',
        render: agent => this.actionButtonsRender(agent)
      }
    ];
  }

  headRender() {
    const formattedButton = this.formattedButton();
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem>
                {!!this.state.totalItems && (
                  <EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
                    <h2>{this.state.totalItems} Agents</h2>
                  </EuiTitle>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="plusInCircle"
              onClick={() => this.props.addingNewAgent()}
            >
              Deploy new agent
            </EuiButtonEmpty>
          </EuiFlexItem>
          {formattedButton}
        </EuiFlexGroup>
        <EuiSpacer size="xs" />
      </div>
    );
  }

  filterBarModelStatus() {
    return {
      label: 'Status',
      options: [
        {
          label: 'Active',
          group: 'status'
        },
        {
          label: 'Disconnected',
          group: 'status'
        },
        {
          label: 'Never connected',
          group: 'status'
        }
      ]
    };
  }

  async filterBarModelGroups() {
    const rawGroups = await this.props.wzReq('GET', '/agents/groups', {});
    const itemsGroups = (((rawGroups || {}).data || {}).data || {}).items;
    const groups = itemsGroups
      .filter(item => {
        return item.count > 0;
      })
      .map(item => {
        return { label: item.name, group: 'group' };
      });
    return {
      label: 'Groups',
      options: groups
    };
  }

  async filterBarModelOs() {
    const rawOs = await this.props.wzReq(
      'GET',
      '/agents/stats/distinct?pretty',
      {
        fields: 'os.name,os.version',
        q: 'id!=000'
      }
    );
    const itemsOs = (((rawOs || {}).data || {}).data || {}).items;
    const os = itemsOs
      .filter(item => {
        return Object.keys(item).includes('os');
      })
      .map(item => {
        const { name, version } = item.os;
        return {
          label: `${name}-${version}`,
          group: 'osname',
          query: `os.name=${name};os.version=${version}`
        };
      });
    return {
      label: 'OS Name',
      options: os
    };
  }

  async filterBarModelOsPlatform() {
    const rawOsPlatform = await this.props.wzReq(
      'GET',
      '/agents/stats/distinct?pretty',
      {
        fields: 'os.platform',
        q: 'id!=000'
      }
    );
    const itemsOsPlatform = (((rawOsPlatform || {}).data || {}).data || {})
      .items;
    const osPlatform = itemsOsPlatform
      .filter(item => {
        return Object.keys(item).includes('os');
      })
      .map(item => {
        const { platform } = item.os;
        return {
          label: platform,
          group: 'osplatform',
          query: `os.name=${platform}`
        };
      });
    return {
      label: 'OS Platform',
      options: osPlatform
    };
  }

  async filterBarModelNodes() {
    const rawNodes = await this.props.wzReq(
      'GET',
      '/agents/stats/distinct?pretty',
      {
        fields: 'node_name',
        q: 'id!=000;node_name!=unknown'
      }
    );
    const itemsNodes = (((rawNodes || {}).data || {}).data || {}).items;
    const nodes = itemsNodes
      .filter(item => {
        return Object.keys(item).includes('node_name');
      })
      .map(item => {
        const { node_name } = item;
        return {
          label: node_name,
          group: 'nodename',
          query: `node_name=${node_name}`
        };
      });
    return {
      label: 'Nodes',
      options: nodes
    };
  }

  async filterBarModelWazuhVersion() {
    const rawVersions = await this.props.wzReq(
      'GET',
      '/agents/stats/distinct?pretty',
      {
        fields: 'version',
        q: 'id!=000'
      }
    );
    const itemsVersions = (((rawVersions || {}).data || {}).data || {}).items;
    const versions = itemsVersions
      .filter(item => {
        return Object.keys(item).includes('version');
      })
      .map(item => {
        return {
          label: item.version,
          group: 'version'
        };
      });
    return {
      label: 'Version',
      options: versions
    };
  }

  filterBarRender() {
    const {
      filterStatus,
      filterGroups,
      filterOs,
      filterVersion,
      filterOsPlatform,
      filterNodes
    } = this.state;
    const model = [
      filterStatus || { label: 'Status', options: [] },
      filterGroups || { label: 'Groups', options: [] },
      filterOs || { label: 'OS Name', options: [] },
      filterOsPlatform || { label: 'OS Platform', options: [] },
      filterVersion || { label: 'Version', options: [] },
      filterNodes || { label: 'Nodes', options: [] }
    ];
    const { selectedOptions } = this.state;

    return (
      <EuiFlexGroup>
        <EuiFlexItem style={{ marginRight: 0 }}>
          <WzFilterBar
            model={model}
            clickAction={this.onQueryChange}
            selectedOptions={selectedOptions}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            iconType="refresh"
            fill={true}
            onClick={() => this.reloadAgents()}
          >
            Refresh
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  tableRender() {
    const getRowProps = item => {
      const { id } = item;
      return {
        'data-test-subj': `row-${id}`,
        className: 'customRowClass',
        onClick: () => this.props.clickAction(item)
      };
    };

    const {
      pageIndex,
      pageSize,
      totalItems,
      agents,
      sortField,
      sortDirection
    } = this.state;
    const columns = this.columns();
    const pagination =
      totalItems > 15
        ? {
            pageIndex: pageIndex,
            pageSize: pageSize,
            totalItemCount: totalItems,
            pageSizeOptions: [15, 25, 50, 100]
          }
        : false;
    const sorting = {
      sort: {
        field: sortField,
        direction: sortDirection
      }
    };
    const isLoading = this.state.isLoading;
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiBasicTable
            items={agents}
            columns={columns}
            onChange={this.onTableChange}
            sorting={sorting}
            loading={isLoading}
            rowProps={getRowProps}
            noItemsMessage="No agents found"
            {...(pagination && { pagination })}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  render() {
    const title = this.headRender();
    const filter = this.filterBarRender();
    const table = this.tableRender();

    return (
      <div>
        {filter}
        <EuiSpacer size="m" />
        <EuiPanel paddingSize="m">
          {title}
          {table}
        </EuiPanel>
      </div>
    );
  }
}

AgentsTable.propTypes = {
  wzReq: PropTypes.func,
  addingNewAgent: PropTypes.func,
  downloadCsv: PropTypes.func,
  clickAction: PropTypes.func,
  timeService: PropTypes.func,
  reload: PropTypes.func
};

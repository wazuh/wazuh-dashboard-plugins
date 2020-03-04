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
  EuiSpacer,
  EuiLoadingSpinner,
  EuiCallOut,
} from '@elastic/eui';
import { WzFilterBar } from '../../../components/wz-filter-bar/wz-filter-bar'
import { toastNotifications } from 'ui/notify';
import { WzRequest } from '../../../react-services/wz-request'

export class AgentsTable extends Component {

  constructor(props) {
    super(props);
    const selectedOptions = JSON.parse(sessionStorage.getItem('agents_preview_selected_options'));
    this.state = {
      agents: [],
      isLoading: false,
      isProcessing: true,
      pageIndex: 0,
      pageSize: 10,
      q: '',
      search: '',
      selectedOptions: selectedOptions || [],
      sortDirection: 'asc',
      sortField: 'id',
      totalItems: 0,
      selectedItems: [],
      allSelected: false
    }
    this.downloadCsv.bind(this);
  }

  async componentWillMount() {
    const managerVersion = await WzRequest.apiReq(
      'GET',
      '/version',
      {}
    );
    const totalAgent = await WzRequest.apiReq(
      'GET',
      '/agents',
      {}
    );
    this.setState({
      managerVersion: managerVersion.data.data,
      totalAgent: totalAgent.data.data.totalItems
    });
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
      isLoading: true,
    });
  };

  onQueryChange = ({ q = {}, search = {}, selectedOptions = {} }) => {
    sessionStorage.setItem('agents_preview_selected_options', JSON.stringify(selectedOptions));
    this.setState({
      q,
      search,
      selectedOptions,
      isProcessing: true,
      isLoading: true,
    });
  };

  async componentDidMount() {
    await this.getItems();
    const filterStatus = this.filterBarModelStatus();
    const filterGroups = await this.filterBarModelGroups();
    const filterOs = await this.filterBarModelOs();
    const filterVersion = await this.filterBarModelWazuhVersion();
    const filterOsPlatform = await this.filterBarModelOsPlatform();
    const filterNodes = await this.filterBarModelNodes();
    this.setState({
      filterStatus,
      filterGroups,
      filterOs,
      filterVersion,
      filterOsPlatform,
      filterNodes,
    });
  }

  async reloadAgents() {
    this.setState({
      isProcessing: true,
      isLoading: true,
    });
    await this.props.reload();
    this.checkAgentsUpdating();
  }

  async componentDidUpdate(prevProps, prevState) {
    if (this.state.isProcessing) {
      const { q, search } = this.state;
      const { q: prevQ, search: prevSearch } = prevState;
      if (prevQ !== q || prevSearch !== search) {
        this.setState({ pageIndex: 0 });
      }
      await this.getItems();
    }
  }

  async getItems() {
    const rawAgents = await this.props.wzReq(
      'GET',
      '/agents',
      this.buildFilter()
    );

    const formatedAgents = (((rawAgents || {}).data || {}).data || {}).items.map(this.formatAgent.bind(this));
    this.setState({
      agents: formatedAgents,
      totalItems: (((rawAgents || {}).data || {}).data || {}).totalItems,
      isProcessing: false,
      isLoading: false,
    });
  }

  buildFilter() {
    const { pageIndex, pageSize, search } = this.state;

    const filter = {
      offset: pageIndex * pageSize,
      limit: pageSize,
      q: this.buildQFilter(),
      sort: this.buildSortFilter(),
    };

    if (search !== '') {
      filter.search = search;
    }
    return filter;
  }

  buildSortFilter() {
    const { sortField, sortDirection } = this.state;

    const field = (sortField === 'os_name') ? '' : sortField;
    const direction = (sortDirection === 'asc') ? '+' : '-';

    return direction + field;
  }

  buildQFilter() {
    const { q } = this.state;
    return (q === '') ? `id!=000` : `id!=000;${q}`;
  }

  formatAgent(agent) {
    const checkField = (field) => { return (field !== undefined) ? field : "-"; };
    const lastKeepAlive = (date, timeService) => { return (date !== undefined) ? timeService(date) : "-"; };
    const agentVersion = (agent.version !== undefined) ? agent.version.split(' ')[1] : ".";
    const { timeService } = this.props;
    return {
      "id": agent.id,
      "name": agent.name,
      "ip": agent.ip,
      "status": agent.status,
      "group": checkField(agent.group),
      "os_name": agent,
      "version": agentVersion,
      "dateAdd": timeService(agent.dateAdd),
      "lastKeepAlive": lastKeepAlive(agent.lastKeepAlive, timeService),
      "actions": agent
    }
  }

  actionButtonsRender(agent) {
    return (
      <div>
        <EuiToolTip content="Open Discover panel for this agent" position="left">
          <EuiButtonIcon
            onClick={(ev) => {
              ev.stopPropagation();
              this.props.clickAction(agent, 'discover');
            }}
            iconType="discoverApp"
            aria-label="Open Discover panel for this agent"
          />
        </EuiToolTip>
        <EuiToolTip content="Open configuration for this agent" position="left">
          <EuiButtonIcon
            onClick={(ev) => {
              ev.stopPropagation();
              this.props.clickAction(agent, 'configuration')
            }}
            color={'text'}
            iconType="wrench"
            aria-label="Open configuration for this agent"
          />
        </EuiToolTip>
      </div>
    );
  }

  addIconPlatformRender(agent) {
    let icon = false;
    const checkField = (field) => { return (field !== undefined) ? field : "-"; };
    const os = (agent || {}).os;

    if (((os || {}).uname || '').includes('Linux')) {
      icon = 'linux'
    } else if ((os || {}).platform === 'windows') {
      icon = 'windows'
    } else if ((os || {}).platform === 'darwin') {
      icon = 'apple'
    }
    const os_name = checkField(((agent || {}).os || {}).name)
      + checkField(((agent || {}).os || {}).version);

    return (
      <span className="euiTableCellContent__text euiTableCellContent--truncateText">
        <i className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${icon}`} aria-hidden="true"></i> {os_name === '--' ? '-' : os_name}
      </span>
    );

  }

  addIconUpgrade(agent, item) {
    let spinner = '';

    if (item.upgrading === true) {
      spinner = (
        <EuiToolTip content="This agent is being updated." position="right">
          <EuiLoadingSpinner size="s" />
        </EuiToolTip>
      )
    }

    return (
      <div>
        <span className="euiTableCellContent__text euiTableCellContent--truncateText">
          {agent}
        </span>
        &nbsp;&nbsp;
        {spinner}
      </div>
    )
  }

  addHealthStatusRender(status) {
    const color = (status) => {
      if (status.toLowerCase() === 'active') {
        return 'success';
      } else if (status.toLowerCase() === 'disconnected') {
        return 'danger';
      } else if (status.toLowerCase() === 'never connected') {
        return 'subdued';
      }
    };

    return (
      <EuiHealth color={color(status)}>
        {status}
      </EuiHealth>
    );
  }

  downloadCsv = () => {
    const { q, search = {} } = this.buildFilter();
    const filterQ = { name: 'q', value: q };
    const filterSearch = { name: 'search', value: search }
    this.props.downloadCsv([filterQ, filterSearch])
  }

  formattedButton() {
    return (
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty iconType="importAction" onClick={this.downloadCsv}>
          Export formatted
        </EuiButtonEmpty>
      </EuiFlexItem>
    );
  }

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  /* MULTISELECT TABLE */
  onSelectionChange = (selectedItems) => {
    const { managerVersion } = this.state;

    selectedItems.forEach(item => {
      if (managerVersion > item.version && item.version !== '.') {
        item.outdated = true;
      }
    });
    this.setState({ selectedItems });
  };

  renderUpgradeButton() {
    const { selectedItems, allSelected } = this.state;

    if (selectedItems.length === 0 ||
      (selectedItems.length > 0 && selectedItems.filter(item => item.outdated).length === 0) ||
      (selectedItems.length > 0 && selectedItems.filter(item => item.upgrading).length > 0)) {
      return;
    }

    return (
      <EuiButton style={{ margin: 6 }} color="secondary" iconType="sortUp" onClick={
        allSelected === true ? this.upgradeAllAgents : this.onClickUpgrade
      }>
        Upgrade {allSelected === true ? 'All' : selectedItems.filter(item => item.outdated).length} Agents
      </EuiButton>
    );
  }

  renderRestartButton() {
    const { selectedItems, allSelected } = this.state;

    if (selectedItems.length === 0 || selectedItems.filter(item => item.status === 'Active').length === 0) {
      return;
    }

    return (
      <EuiButton style={{ margin: 6 }} color="primary" iconType="refresh" onClick={
        allSelected === true ? this.restartAllAgents : this.onClickRestart
      }>
        Restart {allSelected === true ? 'All' : selectedItems.filter(item => item.status === 'Active').length} Agents
      </EuiButton>
    );
  }

  callOutRender() {
    const { selectedItems, agents, pageSize, totalAgent, allSelected } = this.state;

    if (selectedItems.length === 0) {
      return;
    } else if (selectedItems.length === agents.length || selectedItems.length === pageSize) {
      return (
        <div>
          <EuiSpacer size="s" />
          <EuiCallOut
            size="s"
            title={`All ${selectedItems.length} agents on this page are selected.`}
          >
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiButton onClick={() => {
                  this.setState(prevState => ({ allSelected: !prevState.allSelected }))
                }}>
                  {allSelected === true ? `Clear ${totalAgent - 1} agents selected.` : `Select all ${totalAgent - 1} agents.`}
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiCallOut>
        </div>
      )
    }
  }

  setUpgradingState(agentID) {
    const { agents } = this.state;
    agents.forEach(element => {
      element.id === agentID ? element.upgrading = true : false;
    });
    this.setState({ agents });
  }

  checkAgentsUpdating() {
    const { agents, managerVersion } = this.state;

    if (localStorage.getItem('upgradeAgents') !== null) {
      const upgradingAgents = JSON.parse(localStorage.getItem('upgradeAgents')).map(element => element.itemId);
      agents.map(agent => {
        upgradingAgents.map(upgradingAgent => {
          if (agent.id === upgradingAgent && agent.version === managerVersion) {
            agent.upgrading = false;
          }
        });
      });
      this.setState({ agents });
    }
  }

  onClickUpgrade = () => {
    localStorage.removeItem('upgradeAgents');
    const { selectedItems } = this.state;
    let feedbackFlag = false;
    let upgradeStorage = [];

    for (let item of selectedItems.filter(item => item.outdated)) {
      try {
        WzRequest.apiReq('PUT', `/agents/${item.id}/upgrade`, '1');
        upgradeStorage = [
          ...upgradeStorage,
          {
            'itemId': item.id,
            'lastTimeUpgrade': new Date()
          }
        ];
        localStorage.setItem('upgradeAgents', JSON.stringify(upgradeStorage));
        this.setUpgradingState(item.id);
        feedbackFlag = true;
        this.checkAgentsUpdating();
        setTimeout(() => {
          this.reloadAgents();
        }, 900000);
      } catch (error) {
        this.showToast('danger', 'Error Upgrading Agents.', error, 5000);
      }
    }
    feedbackFlag === true ? this.showToast('success', 'Upgrading Agents', '', 5000) : false;
  };

  onClickRestart = () => {
    localStorage.removeItem('upgradeAgents');
    const { selectedItems } = this.state;
    const agentsId = selectedItems.map(item => item.id);
    try {
      WzRequest.apiReq('PUT', `/agents/restart`, { ids: [...agentsId] });
      this.showToast('success', 'Restarting agents.', '', 5000);
    } catch (error) {
      this.showToast('warning', 'Error restarting agents', error, 5000);
    }
  };

  restartAllAgents = () => {
    this.showToast('success', 'Restarting all agents.', '', 5000);
  }

  upgradeAllAgents = () => {
    this.showToast('success', 'Upgrading all agents.', '', 5000);
  }

  columns() {
    return [
      {
        field: 'id',
        name: 'ID',
        sortable: true,
        width: '65px',
      },
      {
        field: 'name',
        name: 'Name',
        sortable: true,
        truncateText: true,
      },
      {
        field: 'ip',
        name: 'IP',
        truncateText: true,
        sortable: true,
      },
      {
        field: 'group',
        name: 'Group(s)',
        truncateText: true,
        sortable: true,
      },
      {
        field: 'os_name',
        name: 'OS',
        sortable: true,
        truncateText: true,
        render: this.addIconPlatformRender,
      },
      {
        field: 'version',
        name: 'Version',
        width: '100px',
        truncateText: true,
        sortable: true,
        render: (agent, item) => this.addIconUpgrade(agent, item),
      },
      {
        field: 'dateAdd',
        name: 'Registration date',
        truncateText: true,
        sortable: true,
      },
      {
        field: 'lastKeepAlive',
        name: 'Last keep alive',
        truncateText: true,
        sortable: true,
      },
      {
        field: 'status',
        name: 'Status',
        truncateText: true,
        sortable: true,
        render: this.addHealthStatusRender,
      },
      {
        align: 'left',
        width: '100px',
        field: 'actions',
        name: 'Actions',
        render: (agent) => this.actionButtonsRender(agent)
      },
    ];
  }

  headRender() {
    const formattedButton = this.formattedButton()
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle size={"s"} style={{ padding: '6px 0px' }}>
                  <h2>{this.state.totalItems} Total Agents</h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType="plusInCircle" onClick={() => this.props.addingNewAgent()}>
              Deploy new agent
          </EuiButtonEmpty>
          </EuiFlexItem>
          {formattedButton}
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType="refresh" onClick={() => this.reloadAgents()}>
              Refresh
          </EuiButtonEmpty>
          </EuiFlexItem>
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
      .filter((item) => { return item.count > 0; })
      .map((item) => { return { label: item.name, group: 'group' } });
    return {
      label: 'Groups',
      options: groups,
    };
  }

  async filterBarModelOs() {
    const rawOs = await this.props.wzReq(
      'GET',
      '/agents/stats/distinct?pretty',
      {
        'fields': 'os.name,os.version',
        'q': 'id!=000'
      }
    );
    const itemsOs = (((rawOs || {}).data || {}).data || {}).items;
    const os = itemsOs
      .filter((item) => { return Object.keys(item).includes('os') })
      .map((item) => {
        const { name, version } = item.os;
        return {
          label: `${name}-${version}`,
          group: 'osname',
          query: `os.name=${name};os.version=${version}`
        };
      });
    return {
      label: 'OS Name',
      options: os,
    };
  }

  async filterBarModelOsPlatform() {
    const rawOsPlatform = await this.props.wzReq(
      'GET',
      '/agents/stats/distinct?pretty',
      {
        'fields': 'os.platform',
        'q': 'id!=000'
      }
    );
    const itemsOsPlatform = (((rawOsPlatform || {}).data || {}).data || {}).items;
    const osPlatform = itemsOsPlatform
      .filter((item) => { return Object.keys(item).includes('os') })
      .map((item) => {
        const { platform } = item.os;
        return {
          label: platform,
          group: 'osplatform',
          query: `os.name=${platform}`
        };
      });
    return {
      label: 'OS Platform',
      options: osPlatform,
    };
  }

  async filterBarModelNodes() {
    const rawNodes = await this.props.wzReq(
      'GET',
      '/agents/stats/distinct?pretty',
      {
        'fields': 'node_name',
        'q': 'id!=000;node_name!=unknown'
      }
    );
    const itemsNodes = (((rawNodes || {}).data || {}).data || {}).items;
    const nodes = itemsNodes
      .filter((item) => { return Object.keys(item).includes('node_name') })
      .map((item) => {
        const { node_name } = item;
        return {
          label: node_name,
          group: 'nodename',
          query: `node_name=${node_name}`
        };
      });
    return {
      label: 'Nodes',
      options: nodes,
    };
  }

  async filterBarModelWazuhVersion() {
    const rawVersions = await this.props.wzReq(
      'GET',
      '/agents/stats/distinct?pretty',
      {
        'fields': 'version',
        'q': 'id!=000'
      }
    );
    const itemsVersions = (((rawVersions || {}).data || {}).data || {}).items;
    const versions = itemsVersions
      .filter((item) => { return Object.keys(item).includes('version') })
      .map((item) => {
        return {
          label: item.version,
          group: 'version'
        }
      });
    return {
      label: 'Version',
      options: versions,
    }
  }

  filterBarRender() {
    const {
      filterStatus,
      filterGroups,
      filterOs,
      filterVersion,
      filterOsPlatform,
      filterNodes,
    } = this.state;
    const model = [
      filterStatus || { label: 'Status', options: [] },
      filterGroups || { label: 'Groups', options: [] },
      filterOs || { label: 'OS Name', options: [] },
      filterOsPlatform || { label: 'OS Platform', options: [] },
      filterVersion || { label: 'Version', options: [] },
      filterNodes || { label: 'Nodes', options: [] },
    ];
    const { selectedOptions } = this.state;

    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <WzFilterBar
            model={model}
            clickAction={this.onQueryChange}
            selectedOptions={selectedOptions}
          />
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
        onClick: () => { }
      };
    };

    const getCellProps = item => {
      return {
        onClick: () => this.props.clickAction(item),
      };
    };

    const { pageIndex, pageSize, totalItems, agents, sortField, sortDirection } = this.state
    const columns = this.columns();
    const pagination = {
      pageIndex: pageIndex,
      pageSize: pageSize,
      totalItemCount: totalItems,
      pageSizeOptions: [10, 25, 50, 100],
    }
    const sorting = {
      sort: {
        field: sortField,
        direction: sortDirection,
      },
    };
    const isLoading = this.state.isLoading;

    const selection = {
      /* selectable: agent => agent.status === 'Active', */
      onSelectionChange: this.onSelectionChange,
    };

    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiBasicTable
            items={agents}
            itemId='id'
            columns={columns}
            pagination={pagination}
            onChange={this.onTableChange}
            sorting={sorting}
            loading={isLoading}
            rowProps={getRowProps}
            cellProps={getCellProps}
            isSelectable={true}
            selection={selection}
            noItemsMessage="No agents found"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }

  render() {
    const title = this.headRender();
    const filter = this.filterBarRender();
    const upgradeButton = this.renderUpgradeButton();
    const restartButton = this.renderRestartButton();
    const table = this.tableRender();
    const callOut = this.callOutRender();

    return (
      <EuiPanel paddingSize="m">
        {title}
        {filter}
        {upgradeButton}
        {restartButton}
        {callOut}
        {table}
      </EuiPanel>
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

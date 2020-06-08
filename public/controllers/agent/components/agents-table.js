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
  EuiCallOut,
  EuiOverlayMask,
  EuiConfirmModal,
  EuiLoadingSpinner
} from '@elastic/eui';
import { WzFilterBar } from '../../../components/wz-filter-bar/wz-filter-bar';
import { CheckUpgrade } from './checkUpgrade';
import { toastNotifications } from 'ui/notify';
import { WzRequest } from '../../../react-services/wz-request';
import { ActionAgents } from '../../../react-services/action-agents';
import { AppNavigate } from '../../../react-services/app-navigate';
import { AgentGroupTruncate } from '../../../components/common/util';

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
      totalItems: 0,
      selectedItems: [],
      allSelected: false,
      purgeModal: false
    };
    this.downloadCsv.bind(this);
  }

  async UNSAFE_componentWillMount() {
    const managerVersion = await WzRequest.apiReq('GET', '/version', {});
    const totalAgent = await WzRequest.apiReq('GET', '/agents', {});
    const agentActive = await WzRequest.apiReq('GET', '/agents', {
      q: 'status=active'
    });

    this.setState({
      managerVersion: managerVersion.data.data,
      agentActive: agentActive.data.data.totalItems,
      avaibleAgents: totalAgent.data.data.items
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

  async componentDidMount() {
    this._isMount = true;
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
      filterNodes
    });
  }

  async reloadAgents() {
    const totalAgent = await WzRequest.apiReq('GET', '/agents', {});
    this.setState({
      isProcessing: true,
      isLoading: true,
      avaibleAgents: totalAgent.data.data.items
    });
    await this.props.reload();
  }

  async componentDidUpdate(prevProps, prevState) {
    if(this.props.filters && this.props.filters.length){
      this.setState({selectedOptions: this.props.filters, 
        q:`${this.props.filters[0].group}=${ this.props.filters[0].label_}`,
        isProcessing: true,
        isLoading: false});
      this.props.removeFilters()
    }
    if (this.state.isProcessing) {
      const { q, search } = this.state;
      const { q: prevQ, search: prevSearch } = prevState;
      if (prevQ !== q || prevSearch !== search) {
        this.setState({ pageIndex: 0 });
      }
      await this.getItems();
    }
    if (prevState.allSelected === false && this.state.allSelected === true) {
      this.setState({ loadingAllItem: true });
      this.getAllItems();
    }
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

  async getAllItems() {
    const { pageIndex, pageSize } = this.state;
    const filterTable = {
      offset: pageIndex * pageSize,
      limit: pageSize,
      q: this.buildQFilter(),
      sort: this.buildSortFilter()
    };

    const filterAll = {
      q: this.buildQFilter(),
      sort: this.buildSortFilter()
    };

    const rawAgents = await this.props.wzReq('GET', '/agents', filterTable);

    const agentsFiltered = await this.props
      .wzReq('GET', '/agents', filterAll)
      .then(() => {
        this.setState({ loadingAllItem: false });
      });

    const formatedAgents = (
      ((rawAgents || {}).data || {}).data || {}
    ).items.map(this.formatAgent.bind(this));
    this._isMount &&
      this.setState({
        agents: formatedAgents,
        avaibleAgents: agentsFiltered.data.data.items,
        totalItems: (((rawAgents || {}).data || {}).data || {}).totalItems,
        isProcessing: false,
        isLoading: false
      });
  }

  buildFilter() {
    const { pageIndex, pageSize, search } = this.state;

    const filter = {
      offset: (pageIndex * pageSize) || 0,
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
      agent.version !== undefined ? agent.version.split(' ')[1] : '-';
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
      actions: agent,
      upgrading: false
    };
  }

  actionButtonsRender(agent) {
    return agent.status !== 'Never connected' ? (
      <div>
        <EuiToolTip
          content="Open summary panel for this agent"
          position="left"
        >
          <EuiButtonIcon
            onClick={() => ev => {
              ev.stopPropagation();
              this.props.clickAction(agent, 'discover');
            }}
            iconType="eye"
            color={'primary'}
            aria-label="Open summary panel for this agent"
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
      </div>
    ) : null;
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
        {os_name === '- -' ? '-' : os_name}
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

  reloadAgent = () => {
    this.setState({
      isProcessing: true,
      isLoading: true
    });
    this.props.reload();
  };

  addUpgradeStatus(version, agent) {
    const { managerVersion } = this.state;
    return (
      <CheckUpgrade
        {...agent}
        managerVersion={managerVersion}
        changeStatusUpdate={this.changeUpgradingState}
        reloadAgent={this.reloadAgent}
      />
    );
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

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };

  /* MULTISELECT TABLE */
  onSelectionChange = selectedItems => {
    const { managerVersion, pageSize } = this.state;

    selectedItems.forEach(item => {
      if (managerVersion > item.version && item.version !== '.') {
        item.outdated = true;
      }
    });

    selectedItems.length !== pageSize
      ? this.setState({ allSelected: false })
      : false;

    this.setState({ selectedItems });
  };

  renderUpgradeButton() {
    const { selectedItems } = this.state;

    if (
      selectedItems.length === 0 ||
      (selectedItems.length > 0 &&
        selectedItems.filter(item => item.outdated).length === 0) ||
      (selectedItems.length > 0 &&
        selectedItems.filter(item => item.upgrading).length > 0) ||
      (selectedItems.length > 0 &&
        selectedItems.filter(item => item.status === 'Active').length === 0) ||
      (selectedItems.length > 0 &&
        selectedItems.filter(item => item.status === 'Active').length === 0 &&
        selectedItems.filter(item => item.status === 'Disconnected').length >
          0) ||
      selectedItems.filter(item => item.outdated && item.status === 'Active')
        .length === 0
    ) {
      return;
    }

    return (
      <EuiFlexItem grow={false}>
        <EuiButton
          color="secondary"
          iconType="sortUp"
          onClick={this.onClickUpgrade}
        >
          Upgrade{' '}
          {
            selectedItems.filter(
              item => item.outdated && item.status === 'Active'
            ).length
          }{' '}
          agents
        </EuiButton>
      </EuiFlexItem>
    );
  }

  renderUpgradeButtonAll() {
    const { selectedItems, avaibleAgents, managerVersion } = this.state;

    if (
      selectedItems.length > 0 &&
      avaibleAgents.filter(
        agent =>
          agent.version !== 'Wazuh ' + managerVersion &&
          agent.status === 'Active'
      ).length === 0
    ) {
      return;
    }

    return (
      <EuiFlexItem grow={false}>
        <EuiButton
          color="secondary"
          iconType="sortUp"
          onClick={this.onClickUpgradeAll}
        >
          Upgrade all agents
        </EuiButton>
      </EuiFlexItem>
    );
  }

  renderRestartButton() {
    const { selectedItems } = this.state;

    if (
      selectedItems.length === 0 ||
      selectedItems.filter(item => item.status === 'Active').length === 0
    ) {
      return;
    }

    return (
      <EuiFlexItem grow={false}>
        <EuiButton
          color="primary"
          iconType="refresh"
          onClick={this.onClickRestart}
        >
          Restart{' '}
          {selectedItems.filter(item => item.status === 'Active').length} agents
        </EuiButton>
      </EuiFlexItem>
    );
  }

  renderRestartButtonAll() {
    const { selectedItems, agentActive, avaibleAgents } = this.state;

    if (
      (selectedItems.length > 0 &&
        avaibleAgents.filter(item => item.status === 'Active').length === 0 &&
        selectedItems.length === 0) ||
      agentActive === 0
    ) {
      return;
    }

    return (
      <EuiFlexItem grow={false}>
        <EuiButton
          color="primary"
          iconType="refresh"
          onClick={this.onClickRestartAll}
        >
          Restart all agents
        </EuiButton>
      </EuiFlexItem>
    );
  }

  renderPurgeButton() {
    const { selectedItems } = this.state;

    if (selectedItems.length === 0) {
      return;
    }

    return (
      <EuiFlexItem grow={false}>
        <EuiButton
          iconType="trash"
          color="danger"
          onClick={() => {
            this.setState({ purgeModal: true });
          }}
        >
          Delete {selectedItems.length} agents
        </EuiButton>
      </EuiFlexItem>
    );
  }

  renderPurgeButtonAll() {
    const { selectedItems, allSelected } = this.state;

    if (selectedItems.length === 0 && !allSelected) {
      return;
    }

    return (
      <EuiFlexItem grow={false}>
        <EuiButton
          iconType="trash"
          color="danger"
          onClick={() => {
            this.setState({ purgeModal: true });
          }}
        >
          Delete all agents
        </EuiButton>
      </EuiFlexItem>
    );
  }

  callOutRender() {
    const { selectedItems, pageSize, allSelected, totalItems } = this.state;

    if (selectedItems.length === 0) {
      return;
    } else if (selectedItems.length === pageSize) {
      return (
        <div>
          <EuiSpacer size="m" />
          <EuiCallOut
            size="s"
            title={
              !allSelected
                ? `The ${selectedItems.length} agents on this page are selected`
                : ''
            }
          >
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiButton
                  onClick={() => {
                    this.setState(prevState => ({
                      allSelected: !prevState.allSelected
                    }));
                  }}
                >
                  {allSelected
                    ? `Clear all agents selection (${totalItems})`
                    : `Select all agents (${totalItems})`}
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiCallOut>
          <EuiSpacer size="s" />
        </div>
      );
    }
  }

  setUpgradingState(agentID) {
    const { agents } = this.state;
    agents.forEach(element => {
      element.id === agentID ? (element.upgrading = true) : false;
    });
    this.setState({ agents });
  }

  changeUpgradingState = agentID => {
    const { agents } = this.state;
    agents.forEach(element => {
      element.id === agentID && element.upgrading === true
        ? (element.upgrading = false)
        : false;
    });
    this.setState(() => ({ agents }));
  };

  onClickUpgrade = () => {
    const { selectedItems } = this.state;
    ActionAgents.upgradeAgents(selectedItems);
  };

  onClickUpgradeAll = () => {
    const { avaibleAgents, managerVersion } = this.state;
    ActionAgents.upgradeAllAgents(avaibleAgents, managerVersion);
  };

  onClickRestart = () => {
    const { selectedItems } = this.state;
    ActionAgents.restartAgents(selectedItems);
    this.reloadAgents();
  };

  onClickRestartAll = () => {
    const { avaibleAgents } = this.state;
    ActionAgents.restartAllAgents(avaibleAgents);
    this.reloadAgents();
  };

  onClickPurge = () => {
    const { selectedItems } = this.state;
    const auxAgents = selectedItems
      .map(agent => {
        return agent.id !== '000' ? agent.id : null;
      })
      .filter(agent => agent !== null);

    WzRequest.apiReq('DELETE', `/agents`, {
      purge: true,
      ids: auxAgents,
      older_than: '1s'
    })
      .then(value => {
        value.status === 200
          ? this.showToast(
              'success',
              `Selected agents were successfully deleted`,
              '',
              5000
            )
          : this.showToast(
              'warning',
              `Failed to delete selected agents`,
              '',
              5000
            );
      })
      .catch(error => {
        this.showToast(
          'danger',
          `Failed to delete selected agents`,
          error,
          5000
        );
      })
      .finally(() => {
        this.getAllItems();
        this.reloadAgents();
      });
    this.setState({ purgeModal: false });
  };

  onClickPurgeAll = () => {
    const { avaibleAgents } = this.state;
    const auxAgents = avaibleAgents
      .map(agent => {
        return agent.id !== '000' ? agent.id : null;
      })
      .filter(agent => agent !== null);

    WzRequest.apiReq('DELETE', `/agents`, {
      purge: true,
      ids: auxAgents,
      older_than: '1s'
    })
      .then(value => {
        value.status === 200
          ? this.showToast(
              'success',
              `All agents have been successfully deleted`,
              '',
              5000
            )
          : this.showToast('warning', `Failed to delete all agents`, '', 5000);
      })
      .catch(error => {
        this.showToast('danger', `Failed to delete all agents`, error, 5000);
      })
      .finally(() => {
        this.getAllItems();
        this.reloadAgents();
      });

    this.setState({ purgeModal: false });
  };

  columns() {
    return [
      {
        field: 'id',
        name: 'ID',
        sortable: true,
        width: '5%'
      },
      {
        field: 'name',
        name: 'Name',
        sortable: true,
        width: '20%',
        truncateText: true
      },
      {
        field: 'ip',
        name: 'IP',
        width: '10%',
        truncateText: true,
        sortable: true
      },
      {
        field: 'group',
        name: 'Group(s)',
        width: '20%',
        truncateText: true,
        sortable: true,
        render: groups => groups !== '-' ? this.renderGroups(groups) : '-'
      },
      {
        field: 'os_name',
        name: 'OS',
        sortable: true,
        width: '10%',
        truncateText: true,
        render: this.addIconPlatformRender
      },
      {
        field: 'version',
        name: 'Version',
        width: '5%',
        truncateText: true,
        sortable: true
        /* render: (version, agent) => this.addUpgradeStatus(version, agent), */
      },
      {
        field: 'dateAdd',
        name: 'Registration date',
        width: '10%',
        truncateText: true,
        sortable: true
      },
      {
        field: 'lastKeepAlive',
        name: 'Last keep alive',
        width: '10%',
        truncateText: true,
        sortable: true
      },
      {
        field: 'status',
        name: 'Status',
        truncateText: true,
        sortable: true,
        width: '10%',
        render: this.addHealthStatusRender
      },
      {
        align: 'right',
        width: '5%',
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
                    <h2>Agents ({this.state.totalItems})</h2>
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
          query: `os.platform=${platform}`
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
        onClick: item.status !== 'Never connected' ? () => {} : undefined
      };
    };

    const getCellProps = item => {
      console.log('item', item)
      return {
        onMouseDown: (ev) =>  {
          if(item.status !== 'Never connected'){
            AppNavigate.navigateToModule(ev, 'agents', {"tab": "welcome", "agent": item.id, } );
            ev.stopPropagation();
          }
        }
      }
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

    const selection = {
      selectable: agent => agent.id,
      /* onSelectionChange: this.onSelectionChange */
    };

    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiBasicTable
            items={agents}
            itemId="id"
            columns={columns}
            onChange={this.onTableChange}
            sorting={sorting}
            loading={isLoading}
            rowProps={getRowProps}
            cellProps={getCellProps}
/*             isSelectable={false}
            selection={selection} */
            noItemsMessage="No agents found"
            {...(pagination && { pagination })}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  renderGroups(groups) {
    return(
      <AgentGroupTruncate groups={groups} length={25} label={'more'}/> 
    )
  }

  render() {
    const {
      allSelected,
      purgeModal,
      selectedItems,
      loadingAllItem
    } = this.state;
    const title = this.headRender();
    const filter = this.filterBarRender();
    const upgradeButton = this.renderUpgradeButton();
    const restartButton = this.renderRestartButton();
    const purgeButton = this.renderPurgeButton();
    const upgradeButtonAll = this.renderUpgradeButtonAll();
    const restartButtonAll = this.renderRestartButtonAll();
    const purgeButtonAll = this.renderPurgeButtonAll();
    const table = this.tableRender();
    const callOut = this.callOutRender();
    let renderPurgeModal, loadItems, barButtons;

    if (purgeModal) {
      renderPurgeModal = (
        <EuiOverlayMask>
          <EuiConfirmModal
            title={
              allSelected
                ? 'Delete all agents'
                : `Delete ${selectedItems.length} agents`
            }
            onCancel={() => {
              this.setState({ purgeModal: false });
            }}
            onConfirm={allSelected ? this.onClickPurgeAll : this.onClickPurge}
            cancelButtonText="No, don't do it"
            confirmButtonText="Yes, delete agents"
            defaultFocusedButton="confirm"
            buttonColor="danger"
          >
            <p>Are you sure you want to do this?</p>
          </EuiConfirmModal>
        </EuiOverlayMask>
      );
    }

    if (loadingAllItem) {
      barButtons = (
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiLoadingSpinner size="l" />
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    } else {
      barButtons = (
        <EuiFlexGroup>
          {allSelected ? upgradeButtonAll : upgradeButton}
          {allSelected ? restartButtonAll : restartButton}
          {allSelected ? purgeButtonAll : purgeButton}
        </EuiFlexGroup>
      );
    }

    return (
      <div>
        {filter}
        <EuiSpacer size="m" />
        <EuiPanel paddingSize="m">
          {title}
          {loadItems}
          {selectedItems.length > 0 && barButtons}
          {callOut}
          {table}
          {renderPurgeModal}
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

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
  EuiConfirmModal
} from '@elastic/eui';
import { WzFilterBar } from '../../../components/wz-filter-bar/wz-filter-bar'
import { CheckUpgrade } from './checkUpgrade';
import { toastNotifications } from 'ui/notify';
import { WzRequest } from '../../../react-services/wz-request'
import { timeout } from 'd3';

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
      allSelected: false,
      purgeModal: false
    }
    this.downloadCsv.bind(this);
  }

  async componentWillMount() {
    const managerVersion = await WzRequest.apiReq('GET', '/version', {});
    const totalAgent = await WzRequest.apiReq('GET', '/agents', {});
    const outdatedAgents = await WzRequest.apiReq('GET', '/agents/outdated', {});
    const agentActive = await WzRequest.apiReq('GET', '/agents', {"q":"status=active"});

    
    this.setState({ 
      managerVersion: managerVersion.data.data,
      outdatedAgents: outdatedAgents.data.data.totalItems,
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
      "actions": agent,
      "upgrading": false
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

  reloadAgent = () => {
    this.setState({
      isProcessing: true,
      isLoading: true,
    });
    this.props.reload();
  }

  addUpgradeStatus(version, agent) {
    const { managerVersion } = this.state;
    return (
      <CheckUpgrade {...agent} 
      managerVersion={managerVersion} 
      changeStatusUpdate={this.changeUpgradingState} 
      reloadAgent={this.reloadAgent}
      />
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
    const { managerVersion, pageSize } = this.state;
  
    selectedItems.forEach(item => {
      if (managerVersion > item.version && item.version !== '.') {
        item.outdated = true;
      }
    });

    selectedItems.length !== pageSize ? this.setState({allSelected: false}) : false ;

    this.setState({ selectedItems });
  };

  renderUpgradeButton() {
    const { selectedItems } = this.state;
    
    if (selectedItems.length === 0 ||
      (selectedItems.length > 0 && selectedItems.filter(item => item.outdated).length === 0) || 
      (selectedItems.length > 0 && selectedItems.filter(item => item.upgrading).length > 0) ||
      (selectedItems.length > 0 && selectedItems.filter(item => item.status === 'Active').length === 0)) {
      return;
    }
  
    return ( 
      <EuiFlexItem grow={false}>
        <EuiButton color="secondary" iconType="sortUp" onClick={this.onClickUpgrade}>
          Upgrade {selectedItems.filter(item => item.outdated).length} Agents
        </EuiButton>
      </EuiFlexItem>
    );
  }

  renderUpgradeButtonAll() {
    const { selectedItems, outdatedAgents } = this.state;
  
    if (selectedItems.length === 0 || (selectedItems.length > 0 && outdatedAgents === 0)) {
      return;
    }

    return (
      <EuiFlexItem grow={false}>
        <EuiButton color="secondary" iconType="sortUp" onClick={this.onClickUpgradeAll}>
          Upgrade All Agents
        </EuiButton>
      </EuiFlexItem>
    );
  }

  renderRestartButton() {
    const { selectedItems } = this.state;
    
    if (selectedItems.length === 0 || selectedItems.filter(item => item.status === 'Active').length === 0) {
      return;
    }

    return (
      <EuiFlexItem grow={false}>
        <EuiButton color="primary" iconType="refresh" onClick={this.onClickRestart}>
          Restart {selectedItems.filter(item => item.status === 'Active').length} Agents
        </EuiButton>
      </EuiFlexItem>
    );
  }

  renderRestartButtonAll() {
    const { selectedItems, agentActive } = this.state;
    
    if (selectedItems.length === 0 || agentActive === 0) {
      return;
    }

    return (
      <EuiFlexItem grow={false}>
        <EuiButton color="primary" iconType="refresh" onClick={this.onClickRestartAll}>
          Restart All Agents
        </EuiButton>
      </EuiFlexItem>
    );
  }

  renderRestartButtonAll() {
    const { selectedItems, agentActive } = this.state;
    
    if (selectedItems.length === 0 || agentActive === 0) {
      return;
    }

    return (
      <EuiFlexItem grow={false}>
        <EuiButton color="primary" iconType="refresh" onClick={this.onClickRestartAll}>
          Restart All Agents
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
        <EuiButton iconType="trash" color="danger" onClick={() => {this.setState({purgeModal: true})}}>
          Purge {selectedItems.length} Agents
        </EuiButton>
      </EuiFlexItem>
    );
  }

  renderPurgeButtonAll() {
    const { selectedItems } = this.state;
    
    if (selectedItems.length === 0) {
      return;
    }

    return (
      <EuiFlexItem grow={false}>
        <EuiButton iconType="trash" color="danger" onClick={() => {this.setState({purgeModal: true})}}>
          Purge All Agents
        </EuiButton>
      </EuiFlexItem>
    );
  }

  callOutRender() {
    const { selectedItems, agents, pageSize, allSelected, totalItems} = this.state;
  
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
                  this.setState(prevState => ({allSelected: !prevState.allSelected}))
                }}>
                  {allSelected ? `Clear ${totalItems} agents selected.` : `Select all ${totalItems} agents.`}
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

  changeUpgradingState = (agentID) => {
    const { agents } = this.state;
    agents.forEach(element => {
      (element.id === agentID && element.upgrading === true) ? element.upgrading = false : false;
    });
    this.setState(() => ({agents}));
  }

  onClickUpgrade = () => {
    const { selectedItems } = this.state;
    let upgradeStorage = [];

    for (let item of selectedItems.filter(item => item.outdated)) {
      /* this.setUpgradingState(item.id); */
 			WzRequest.apiReq('PUT', `/agents/${item.id}/upgrade`, '1').then(value => {
        /* upgradeStorage = [
          ...upgradeStorage,
          {
            'itemId': item.id,
            'lastTimeUpgrade': new Date()
          }
        ];
        localStorage.setItem('upgradeAgents', JSON.stringify(upgradeStorage)); */
			})
			.catch(error => {
        console.log(error);
        error !== 'Wazuh API error: 3021 - Timeout executing API request' ? 
        this.showToast('danger', 'Error upgrading all agents.', error, 5000) :
        false;
			});
    }
    this.showToast('success', 'Upgrading Agents', '', 5000)
  }

  onClickUpgradeAll = () => {
    const { avaibleAgents, managerVersion } = this.state;

    avaibleAgents.forEach(agent => {
      if (agent.id !== '000' && agent.version !== ('Wazuh ' + managerVersion) && agent.status === 'Active') {
        WzRequest.apiReq('PUT', `/agents/${agent.id}/upgrade`, '1').then(() => {
          /* upgradeStorage = [
          ...upgradeStorage,
          {
            'itemId': item.id,
            'lastTimeUpgrade': new Date()
          }
        ];
        localStorage.setItem('upgradeAgents', JSON.stringify(upgradeStorage)); */
        })
        .catch(error => {
          console.log(error);
          error !== 'Wazuh API error: 3021 - Timeout executing API request' ? 
          this.showToast('danger', 'Error upgrading all agents.', error, 5000) :
          false;
        })
      }
    });
    this.showToast('success', 'Upgrading Agents', '', 5000);
  }

  onClickRestart = () => {
    const { selectedItems } = this.state;
    const agentsId = selectedItems.map(item => item.id);

    WzRequest.apiReq('PUT', `/agents/restart`, { ids: [...agentsId] }).then(value => {
      value.status === 200 ?
        this.showToast('success', 'Restarting agents.', '', 5000) :
        this.showToast('warning', 'Error restarting agents', '', 5000);
    })
    .catch(error => {
      this.showToast('danger', 'Error restarting agents', error, 5000);
    })
    .then(() => {
      this.reloadAgents();
    });
  };

  onClickRestartAll = () => {
    const { avaibleAgents } = this.state;
    let idAvaibleAgents = [];
    avaibleAgents.forEach(agent => {
      if (agent.id !== '000' && agent.status === 'Active') {
        idAvaibleAgents.push(agent.id);
      }
    });

    WzRequest.apiReq('PUT', `/agents/restart`, { ids: [...idAvaibleAgents] }).then((value) => {
        value.status === 200 ? 
          this.showToast('success', 'Restarting all agents.', '', 5000) : 
          this.showToast('warning', 'Error restarting all agents.', '', 5000);
      }
    )
    .catch(error => {
      this.showToast('danger', 'Error restarting all agents.', error, 5000);
    })
    .finally(() => {
      this.reloadAgents();
    });
  }

  onClickPurge = () => {
    const { selectedItems } = this.state;
    let showToastPurge = false;
    const auxAgents = selectedItems.map(agent => {return agent.id !== '000' ? agent.id : null}).filter(agent => agent !== null);

    WzRequest.apiReq('DELETE', `/agents`, {"purge": true, "ids": auxAgents, "older_than": "1s"}).then((value) => {
      value.status === 200 ? 
        showToastPurge = true : 
        this.showToast('warning', `Failed to purge some agents`, '', 5000);
    })
    .catch(error => {
      this.showToast('danger', `Failed to purge some agents`, error, 5000);
    })
    .finally(() => {
      this.reloadAgents();
    });

    this.setState({purgeModal: false});
    showToastPurge ? this.showToast('success', `Agents purged successfully`, '', 5000) : false;
  }

  onClickPurgeAll = () => {
    const { avaibleAgents } = this.state;
    let showToastPurge = false;
    const auxAgents = avaibleAgents.map(agent => {return agent.id !== '000' ? agent.id : null}).filter(agent => agent !== null);
    
    WzRequest.apiReq('DELETE', `/agents`, {"purge": true, "ids": auxAgents, "older_than": "1s"}).then((value) => {
      value.status === 200 ? 
        showToastPurge = true : 
        this.showToast('warning', `Failed to purge some agents`, '', 5000);
    })
    .catch(error => {
      this.showToast('danger', `Failed to purge some agents`, error, 5000);
    })
    .finally(() => {
      this.reloadAgents();
    });

    this.setState({purgeModal: false});
    showToastPurge ? this.showToast('success', `All agents purged successfully`, '', 5000) : false;
  };

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
        /* render: (version, agent) => this.addUpgradeStatus(version, agent), */
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
        onClick: () => {}
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
      selectable: agent => agent.id,
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
    const { allSelected, purgeModal, selectedItems } = this.state;
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
    let renderPurgeModal;

    if (purgeModal) {
      renderPurgeModal = (
        <EuiOverlayMask>
          <EuiConfirmModal
            title={allSelected ? 'Purge all agents.' : `Purge ${selectedItems.length} agents.`}
            onCancel={() => {this.setState({purgeModal: false })}}
            onConfirm={allSelected ? this.onClickPurgeAll : this.onClickPurge}
            cancelButtonText="No, don't do it"
            confirmButtonText="Yes, purge agents"
            defaultFocusedButton="confirm"
            buttonColor="danger">
            <p>Are you sure you want to do this?</p>
          </EuiConfirmModal>
        </EuiOverlayMask>
      );
    }

    return (
      <EuiPanel paddingSize="l">
        {title}
        {filter}
        <EuiFlexGroup>
          {allSelected ? upgradeButtonAll : upgradeButton}
          {allSelected ? restartButtonAll : restartButton}
          {allSelected ? purgeButtonAll : purgeButton}
        </EuiFlexGroup>
        {callOut}
        {table}
        {renderPurgeModal}
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

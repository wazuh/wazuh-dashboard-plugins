/*
 * Wazuh app - React component for building the agents table.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
  EuiCallOut,
  EuiComboBox,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiIcon,
  EuiInMemoryTable,
  EuiPanel,
  EuiPopover,
  EuiSearchBar,
  EuiSpacer,
  EuiSuggest,
  EuiText,
  EuiToolTip,
  EuiTitle,
  InM
} from '@elastic/eui';
import { WzFilterBar } from '../../../components/wz-filter-bar/wz-filter-bar'

export class AgentsTable extends Component {

  constructor(props) {
    super(props);
    this.state = {
      agents: [],
      pageIndex: 0,
      pageSize: 10,
      sortField: 'id',
      sortDirection: 'asc',
      isProcessing: true,
      totalItems: 0,
      q: '',
      search: '',
    }
    this.downloadCsv.bind(this);
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
    });
  };

  onQueryChange = ({q={}, search={}}) => {
    this.setState({
      q,
      search,
      isProcessing: true,
    });
  };

  async componentDidMount() {
    await this.getItems();
    const filterStatus = await this.filterBarModelStatus();
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
  
  async componentDidUpdate() {
    if (this.state.isProcessing) {
      await this.getItems();
    }

  }


  async getItems() {
    const rawAgents = await this.props.wzReq(
      'GET',
      '/agents',
      this.buildFilter()
    );

    const formatedAgents = (((rawAgents || {}).data || {}).data || {}).items.map(this.formatAgent);
    this.setState({
      agents: formatedAgents,
      totalItems: (((rawAgents || {}).data || {}).data || {}).totalItems - 1,
      isProcessing: false,
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
    const {sortField, sortDirection} = this.state;

    const field = (sortField === 'os_name') ? '' : sortField;
    const direction = (sortDirection === 'asc') ? '+' : '-';
    
    return direction+field;
  }

  buildQFilter() {
    const { q } = this.state;
    return (q === '') ? `id!=000` :`id!=000;${q}`;
  }

  formatAgent(agent) {
    const checkField = (field) => { return (field !== undefined) ? field : "-"; };
    return {
      "id": agent.id,
      "name": agent.name,
      "ip": agent.ip,
      "status": agent.status,
      "group": checkField(agent.group),
      "os_name": checkField(((agent || {}).os || {}).name) + checkField(((agent || {}).os || {}).version),
      "version": checkField(agent.version),
      "dateAdd": agent.dateAdd,
      "lastKeepAlive": checkField(agent.lastKeepAlive),
      "actions": agent
    }
  }

  actionButtonsRender(agent) {
    return (
      <div className="wz-action-buttons">
        <EuiToolTip content="Open Discover panel for this agent" position="left">
          <EuiButtonIcon
            onClick={() => this.props.clickAction(agent, 'discover')}
            iconType="discoverApp"
            aria-label="Open Discover panel for this agent"
          />
        </EuiToolTip>
        <EuiToolTip content="Open configuration for this agent" position="left">
          <EuiButtonIcon
            onClick={() => this.props.clickAction(agent, 'configuration')}
            iconType="wrench"
            aria-label="Open configuration for this agent"
          />
        </EuiToolTip>
      </div>
    );
  }

  downloadCsv = () => {
    const {q,  search={}} = this.buildFilter();
    const filterQ = { name: 'q', value: q };
    const filterSearch = {name: 'search', value: search}
    this.props.downloadCsv([filterQ, filterSearch])
  }
  formattedButton() {
    return (
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty iconType="importAction" onClick={this.downloadCsv}>
          Formatted          
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
      },
      {
        field: 'name',
        name: 'Name',
        sortable: true,
      },
      {
        field: 'ip',
        name: 'IP',
        sortable: true,
      },
      {
        field: 'status',
        name: 'Status',
        sortable: true,
      },
      {
        field: 'group',
        name: 'Group',
        sortable: true,
      },
      {
        field: 'os_name',
        name: 'OS name',
        sortable: true,
      },
      {
        field: 'version',
        name: 'Version',
        sortable: true,
      },
      {
        field: 'dateAdd',
        name: 'Registration date',
        sortable: true,
      },
      {
        field: 'lastKeepAlive',
        name: 'Last keep alive',
        sortable: true,
      },
      {
        field: 'actions',
        name: 'Actions',
        render: (agent) => this.actionButtonsRender(agent)
      },
    ];
  }

  headRender() {
    const formattedButton = this.formattedButton()
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiTitle>
                <h2>Agents</h2>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        {formattedButton}
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty iconType="plusInCircle" onClick={() => this.props.addingNewAgent()}>
            Add new agent
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
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
        'fields':'os.name,os.version',
        'q':'id!=000'
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
        'fields':'os.platform',
        'q':'id!=000'
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
        'fields':'node_name',
        'q':'id!=000;node_name!=unknown'
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
        'fields':'version',
        'q':'id!=000'
      }
    );
    const itemsVersions = (((rawVersions || {}).data || {}).data || {}).items;
    const versions = itemsVersions
      .filter((item) => { return Object.keys(item).includes('version')})
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
      filterStatus || {label: 'Status', options: []},
      filterGroups || {label:'Groups', options: []},
      filterOs || {label:'OS Name', options: []},
      filterOsPlatform || {label:'OS Platform', options: []},
      filterVersion || {label:'Version', options: []},
      filterNodes || {label:'Nodes', options: []},
    ];

    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <WzFilterBar
            model={model}
            clickAction={this.onQueryChange}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  tableRender() {
    const {pageIndex, pageSize, totalItems, agents, sortField, sortDirection} = this.state
    const columns = this.columns();
    const pagination = {
      pageIndex: pageIndex,
      pageSize: pageSize,
      totalItemCount: totalItems,
      hidePerPageOptions: true,
    }
    const sorting = {
      sort: {
        field: sortField,
        direction: sortDirection,
      },
    };
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiBasicTable
            items={agents}
            columns={columns}
            pagination={pagination}
            onChange={this.onTableChange}
            sorting={sorting}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }

  render() {
    const title = this.headRender();
    const filter = this.filterBarRender();
    const table = this.tableRender();

    return (
      <EuiPanel paddingSize="l">
        {title}
        {filter}
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
};

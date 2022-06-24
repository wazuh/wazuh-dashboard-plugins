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

import React, { Component, Fragment } from 'react';
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
  EuiLoadingSpinner,
  EuiCheckboxGroup,
  EuiIcon,
} from '@elastic/eui';
import { CheckUpgrade } from './checkUpgrade';
import { getToasts } from '../../../kibana-services';
import { WzRequest } from '../../../react-services/wz-request';
import { ActionAgents } from '../../../react-services/action-agents';
import { AppNavigate } from '../../../react-services/app-navigate';
import { GroupTruncate } from '../../../components/common/util';
import { WzSearchBar, filtersToObject } from '../../../components/wz-search-bar';
import { getAgentFilterValues } from '../../../controllers/management/components/management/groups/get-agents-filters-values';
import { WzButtonPermissions } from '../../../components/common/permissions/button';
import { formatUIDate } from '../../../react-services/time-service';
import { withErrorBoundary } from '../../../components/common/hocs';
import { API_NAME_AGENT_STATUS, UI_LOGGER_LEVELS, UI_ORDER_AGENT_STATUS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { AgentStatus } from '../../../components/agents/agent_status';

export const AgentsTable = withErrorBoundary(
  class AgentsTable extends Component {
    _isMount = false;
    constructor(props) {
      super(props);
      this.state = {
        agents: [],
        isLoading: false,
        pageIndex: 0,
        pageSize: 15,
        sortDirection: 'asc',
        sortField: 'id',
        totalItems: 0,
        selectedItems: [],
        allSelected: false,
        purgeModal: false,
        isFilterColumnOpen: false,
        filters: sessionStorage.getItem('agents_preview_selected_options')
          ? JSON.parse(sessionStorage.getItem('agents_preview_selected_options'))
          : [],
      };
      this.suggestions = [
        {
          type: 'q',
          label: 'status',
          description: 'Filter by agent connection status',
          operators: ['=', '!='],
          values: UI_ORDER_AGENT_STATUS,
        },
        {
          type: 'q',
          label: 'os.platform',
          description: 'Filter by OS platform',
          operators: ['=', '!='],
          values: async (value) => getAgentFilterValues('os.platform', value, { q: 'id!=000' }),
        },
        {
          type: 'q',
          label: 'ip',
          description: 'Filter by agent IP',
          operators: ['=', '!='],
          values: async (value) => getAgentFilterValues('ip', value, { q: 'id!=000' }),
        },
        {
          type: 'q',
          label: 'name',
          description: 'Filter by agent name',
          operators: ['=', '!='],
          values: async (value) => getAgentFilterValues('name', value, { q: 'id!=000' }),
        },
        {
          type: 'q',
          label: 'id',
          description: 'Filter by agent id',
          operators: ['=', '!='],
          values: async (value) => getAgentFilterValues('id', value, { q: 'id!=000' }),
        },
        {
          type: 'q',
          label: 'group',
          description: 'Filter by agent group',
          operators: ['=', '!='],
          values: async (value) => getAgentFilterValues('group', value, { q: 'id!=000' }),
        },
        {
          type: 'q',
          label: 'node_name',
          description: 'Filter by node name',
          operators: ['=', '!='],
          values: async (value) => getAgentFilterValues('node_name', value, { q: 'id!=000' }),
        },
        {
          type: 'q',
          label: 'manager',
          description: 'Filter by manager',
          operators: ['=', '!='],
          values: async (value) => getAgentFilterValues('manager', value, { q: 'id!=000' }),
        },
        {
          type: 'q',
          label: 'version',
          description: 'Filter by agent version',
          operators: ['=', '!='],
          values: async (value) => getAgentFilterValues('version', value, { q: 'id!=000' }),
        },
        {
          type: 'q',
          label: 'configSum',
          description: 'Filter by agent config sum',
          operators: ['=', '!='],
          values: async (value) => getAgentFilterValues('configSum', value, { q: 'id!=000' }),
        },
        {
          type: 'q',
          label: 'mergedSum',
          description: 'Filter by agent merged sum',
          operators: ['=', '!='],
          values: async (value) => getAgentFilterValues('mergedSum', value, { q: 'id!=000' }),
        },
        {
          type: 'q',
          label: 'dateAdd',
          description: 'Filter by add date',
          operators: ['=', '!='],
          values: async (value) => getAgentFilterValues('dateAdd', value, { q: 'id!=000' }),
        },
        {
          type: 'q',
          label: 'lastKeepAlive',
          description: 'Filter by last keep alive',
          operators: ['=', '!='],
          values: async (value) => getAgentFilterValues('lastKeepAlive', value, { q: 'id!=000' }),
        },
      ];
      this.downloadCsv.bind(this);
    }

    async UNSAFE_componentWillMount() {
      const managerVersion = await WzRequest.apiReq('GET', '/', {});
      const totalAgent = await WzRequest.apiReq('GET', '/agents', {});
      const agentActive = await WzRequest.apiReq('GET', '/agents/summary/status', {});

      
      this.setState({
        managerVersion: managerVersion.data.data.api_version,
        avaibleAgents: totalAgent.data.data.affected_items,
        agentActive: agentActive.data.data.active + agentActive.data.data.disconnected,
      });
    }

    onTableChange = ({ page = {}, sort = {} }) => {
      const { index: pageIndex, size: pageSize } = page;
      const { field: sortField, direction: sortDirection } = sort;
      this._isMount &&
        this.setState({
          pageIndex,
          pageSize,
          sortField,
          sortDirection,
        });
    };

    async componentDidMount() {
      this._isMount = true;
      await this.getItems();
    }

    componentWillUnmount() {
      this._isMount = false;
      if (sessionStorage.getItem('agents_preview_selected_options')) {
        sessionStorage.removeItem('agents_preview_selected_options');
      }
    }

    async reloadAgents() {
      await this.getItems();
      await this.props.reload();
    }

    async componentDidUpdate(prevProps, prevState) {
      if (
        !_.isEqual(prevState.filters, this.state.filters) ||
        prevState.pageIndex !== this.state.pageIndex ||
        prevState.pageSize !== this.state.pageSize ||
        prevState.sortField !== this.state.sortField ||
        prevState.sortDirection !== this.state.sortDirection
      ) {
        await this.getItems();
      } else if (
        !_.isEqual(prevProps.filters, this.props.filters) &&
        this.props.filters &&
        this.props.filters.length
      ) {
        this.setState({ filters: this.props.filters, pageIndex: 0 });
        this.props.removeFilters();
      }
    }

    async getItems() {
      try {
        this._isMount && this.setState({ isLoading: true });
        const rawAgents = await this.props.wzReq('GET', '/agents', { params: this.buildFilter() });

        const formatedAgents = (((rawAgents || {}).data || {}).data || {}).affected_items.map(
          this.formatAgent.bind(this)
        );

        this._isMount &&
          this.setState({
            agents: formatedAgents,
            totalItems: (((rawAgents || {}).data || {}).data || {}).total_affected_items,
            isLoading: false,
          });
      } catch (error) {
        const options = {
          context: `${AgentsTable.name}.getItems`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error: error,
            message: error.message || error,
            title: `Could not get the agents list`,
          },
        };
        getErrorOrchestrator().handleError(options);
        this.setState({ isLoading: false });
      }
    }

    async getAllItems() {
      const { pageIndex, pageSize } = this.state;
      const filterTable = {
        offset: pageIndex * pageSize,
        limit: pageSize,
        q: this.buildQFilter(),
        sort: this.buildSortFilter(),
      };

      const filterAll = {
        q: this.buildQFilter(),
        sort: this.buildSortFilter(),
      };

      const rawAgents = await this.props.wzReq('GET', '/agents', filterTable);

      const agentsFiltered = await this.props.wzReq('GET', '/agents', filterAll).then(() => {
        this._isMount && this.setState({ loadingAllItem: false });
      });

      const formatedAgents = (((rawAgents || {}).data || {}).data || {}).items.map(
        this.formatAgent.bind(this)
      );
      this._isMount &&
        this.setState({
          agents: formatedAgents,
          avaibleAgents: agentsFiltered.data.data.items,
          totalItems: (((rawAgents || {}).data || {}).data || {}).totalItems,
          isLoading: false,
        });
    }

    buildFilter() {
      const { pageIndex, pageSize, filters } = this.state;

      const filter = {
        ...filtersToObject(filters),
        offset: pageIndex * pageSize || 0,
        limit: pageSize,
        sort: this.buildSortFilter(),
      };
      filter.q = !filter.q ? `id!=000` : `id!=000;${filter.q}`;

      return filter;
    }

    buildSortFilter() {
      const { sortField, sortDirection } = this.state;

      const field = sortField === 'os_name' ? 'os.name,os.version' : sortField;
      const direction = sortDirection === 'asc' ? '+' : '-';

      return direction + field;
    }

    buildQFilter() {
      const { q } = this.state;
      return q === '' ? `id!=000` : `id!=000;${q}`;
    }

    formatAgent(agent) {
      const checkField = (field) => {
        return field !== undefined ? field : '-';
      };
      const agentVersion = agent.version !== undefined ? agent.version.split(' ')[1] : '-';
      const node_name = agent.node_name && agent.node_name !== 'unknown' ? agent.node_name : '-';

      return {
        id: agent.id,
        name: agent.name,
        ip: agent.ip,
        status: agent.status,
        group: checkField(agent.group),
        os_name: agent,
        version: agentVersion,
        node_name: node_name,
        dateAdd: agent.dateAdd ? formatUIDate(agent.dateAdd) : '-',
        lastKeepAlive: agent.lastKeepAlive ? formatUIDate(agent.lastKeepAlive) : '-',
        actions: agent,
        upgrading: false,
      };
    }

    actionButtonsRender(agent) {
      return (
        <div className={'icon-box-action'}>
          <EuiToolTip content="Open summary panel for this agent" position="left">
            <EuiButtonIcon
              onClick={(ev) => {
                ev.stopPropagation();
                this.props.clickAction(agent, 'default');
              }}
              iconType="eye"
              color={'primary'}
              aria-label="Open summary panel for this agent"
            />
          </EuiToolTip>
          &nbsp;
          {agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED && (
            <EuiToolTip content="Open configuration for this agent" position="left">
              <EuiButtonIcon
                onClick={(ev) => {
                  ev.stopPropagation();
                  this.props.clickAction(agent, 'configuration');
                }}
                color={'primary'}
                iconType="wrench"
                aria-label="Open configuration for this agent"
              />
            </EuiToolTip>
          )}
        </div>
      );
    }

    addIconPlatformRender(agent) {
      let icon = false;
      const checkField = (field) => {
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

    reloadAgent = () => {
      this._isMount &&
        this.setState({
          isLoading: true,
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
      const filters = this.buildFilter();
      const formatedFilters = Object.keys(filters)
        .filter((field) => !['limit', 'offset', 'sort'].includes(field))
        .map((field) => ({ name: field, value: filters[field] }));
      this.props.downloadCsv(formatedFilters);
    };

    openColumnsFilter = () => {
      this.setState({
        isFilterColumnOpen: !this.state.isFilterColumnOpen,
      });
    };

    formattedButton() {
      return (
        <>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType="importAction" onClick={this.downloadCsv}>
              Export formatted
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiToolTip content="Select columns table" position="left">
              <EuiButtonEmpty onClick={this.openColumnsFilter}>
                <EuiIcon type="managementApp" color="primary" />
              </EuiButtonEmpty>
            </EuiToolTip>
          </EuiFlexItem>
        </>
      );
    }

    showToast = (color, title, text, time) => {
      getToasts().add({
        color: color,
        title: title,
        text: text,
        toastLifeTimeMs: time,
      });
    };

    /* MULTISELECT TABLE */
    onSelectionChange = (selectedItems) => {
      const { managerVersion, pageSize } = this.state;

      selectedItems.forEach((item) => {
        if (managerVersion > item.version && item.version !== '.') {
          item.outdated = true;
        }
      });

      selectedItems.length !== pageSize
        ? this._isMount && this.setState({ allSelected: false })
        : false;

      this._isMount && this.setState({ selectedItems });
    };

    renderUpgradeButton() {
      const { selectedItems } = this.state;

      if (
        selectedItems.length === 0 ||
        (selectedItems.length > 0 && selectedItems.filter((item) => item.outdated).length === 0) ||
        (selectedItems.length > 0 && selectedItems.filter((item) => item.upgrading).length > 0) ||
        (selectedItems.length > 0 &&
          selectedItems.filter((item) => item.status === API_NAME_AGENT_STATUS.ACTIVE).length === 0) ||
        (selectedItems.length > 0 &&
          selectedItems.filter((item) => item.status === API_NAME_AGENT_STATUS.ACTIVE).length === 0 &&
          selectedItems.filter((item) => item.status === API_NAME_AGENT_STATUS.DISCONNECTED).length > 0) ||
        selectedItems.filter((item) => item.outdated && item.status === API_NAME_AGENT_STATUS.ACTIVE).length === 0
      ) {
        return;
      }

      return (
        <EuiFlexItem grow={false}>
          <EuiButton color="secondary" iconType="sortUp" onClick={this.onClickUpgrade}>
            Upgrade{' '}
            {selectedItems.filter((item) => item.outdated && item.status === API_NAME_AGENT_STATUS.ACTIVE).length}{' '}
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
          (agent) => agent.version !== 'Wazuh ' + managerVersion && agent.status === API_NAME_AGENT_STATUS.ACTIVE
        ).length === 0
      ) {
        return;
      }

      return (
        <EuiFlexItem grow={false}>
          <EuiButton color="secondary" iconType="sortUp" onClick={this.onClickUpgradeAll}>
            Upgrade all agents
          </EuiButton>
        </EuiFlexItem>
      );
    }

    renderRestartButton() {
      const { selectedItems } = this.state;

      if (
        selectedItems.length === 0 ||
        selectedItems.filter((item) => item.status === API_NAME_AGENT_STATUS.ACTIVE).length === 0
      ) {
        return;
      }

      return (
        <EuiFlexItem grow={false}>
          <EuiButton color="primary" iconType="refresh" onClick={this.onClickRestart}>
            Restart {selectedItems.filter((item) => item.status === API_NAME_AGENT_STATUS.ACTIVE).length} agents
          </EuiButton>
        </EuiFlexItem>
      );
    }

    renderRestartButtonAll() {
      const { selectedItems, agentActive, avaibleAgents } = this.state;

      if (
        (selectedItems.length > 0 &&
          avaibleAgents.filter((item) => item.status === API_NAME_AGENT_STATUS.ACTIVE).length === 0 &&
          selectedItems.length === 0) ||
        agentActive === 0
      ) {
        return;
      }

      return (
        <EuiFlexItem grow={false}>
          <EuiButton color="primary" iconType="refresh" onClick={this.onClickRestartAll}>
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
              this._isMount && this.setState({ purgeModal: true });
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
                !allSelected ? `The ${selectedItems.length} agents on this page are selected` : ''
              }
            >
              <EuiFlexGroup>
                <EuiFlexItem grow={false}>
                  <EuiButton
                    onClick={() => {
                      this._isMount &&
                        this.setState((prevState) => ({
                          allSelected: !prevState.allSelected,
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

    getTableColumnsSelected() {
      return JSON.parse(window.localStorage.getItem('columnsSelectedTableAgent')) || [];
    }

    setTableColumnsSelected(data) {
      window.localStorage.setItem('columnsSelectedTableAgent', JSON.stringify(data));
    }

    setUpgradingState(agentID) {
      const { agents } = this.state;
      agents.forEach((element) => {
        element.id === agentID ? (element.upgrading = true) : false;
      });
      this._isMount && this.setState({ agents });
    }

    changeUpgradingState = (agentID) => {
      const { agents } = this.state;
      agents.forEach((element) => {
        element.id === agentID && element.upgrading === true ? (element.upgrading = false) : false;
      });
      this._isMount && this.setState(() => ({ agents }));
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

    onClickPurge = async () => {
      const { selectedItems } = this.state;
      const auxAgents = selectedItems
        .map((agent) => {
          return agent.id !== '000' ? agent.id : null;
        })
        .filter((agent) => agent !== null);
      try {
        const response = await WzRequest.apiReq('DELETE', `/agents`, {
          purge: true,
          ids: auxAgents,
          older_than: '1s',
        });
        response.status === 200
          ? this.showToast('success', `Selected agents were successfully deleted`, '', 5000)
          : this.showToast('warning', `Failed to delete selected agents`, '', 5000);
      } catch (error) {
        const options = {
          context: `${AgentsTable.name}.onClickPurge`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error: error,
            message: error.message || error,
            title: `Failed to delete selected agents`,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
      this.getAllItems();
      this.reloadAgents();
      this._isMount && this.setState({ purgeModal: false });
    };

    onClickPurgeAll = () => {
      const { avaibleAgents } = this.state;
      const auxAgents = avaibleAgents
        .map((agent) => {
          return agent.id !== '000' ? agent.id : null;
        })
        .filter((agent) => agent !== null);
      try {
        const response = WzRequest.apiReq('DELETE', `/agents`, {
          purge: true,
          ids: auxAgents,
          older_than: '1s',
        });
        response.status === 200
          ? this.showToast('success', `All agents have been successfully deleted`, '', 5000)
          : this.showToast('warning', `Failed to delete all agents`, '', 5000);
      } catch (error) {
        const options = {
          context: `${AgentsTable.name}.onClickPurgeAll`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error: error,
            message: error.message || error,
            title: `Failed to delete all agents`,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
      this.getAllItems();
      this.reloadAgents();
      this._isMount && this.setState({ purgeModal: false });
    };

    columns() {
      const selectedColumns = this.getTableColumnsSelected();
      const defaultColumns = [
        {
          field: 'id',
          name: 'ID',
          sortable: true,
          width: '6%',
        },
        {
          field: 'name',
          name: 'Name',
          sortable: true,
          width: '15%',
          truncateText: true,
        },
        {
          field: 'ip',
          name: 'IP',
          width: '10%',
          truncateText: true,
          sortable: true,
        },
        {
          field: 'group',
          name: 'Group(s)',
          width: '20%',
          truncateText: true,
          sortable: true,
          render: (groups) => (groups !== '-' ? this.renderGroups(groups) : '-'),
        },
        {
          field: 'os_name',
          name: 'OS',
          sortable: true,
          width: '15%',
          truncateText: true,
          render: this.addIconPlatformRender,
        },
        {
          field: 'node_name',
          name: 'Cluster node',
          width: '10%',
          truncateText: true,
          sortable: true,
        },
        {
          field: 'version',
          name: 'Version',
          width: '5%',
          truncateText: true,
          sortable: true,
          /* render: (version, agent) => this.addUpgradeStatus(version, agent), */
        },
        {
          field: 'dateAdd',
          name: 'Registration date',
          width: '10%',
          truncateText: true,
          sortable: true,
        },
        {
          field: 'lastKeepAlive',
          name: 'Last keep alive',
          width: '10%',
          truncateText: true,
          sortable: true,
        },
        {
          field: 'status',
          name: 'Status',
          truncateText: true,
          sortable: true,
          width: '15%',
          render: (status) => <AgentStatus status={status} labelProps={{className: 'hide-agent-status' }}/>,
        },
        {
          align: 'right',
          width: '5%',
          field: 'actions',
          name: 'Actions',
          render: (agent) => this.actionButtonsRender(agent),
        },
      ];

      if (selectedColumns.length != 0) {
        const newSelectedColumns = [];
        selectedColumns.forEach((item) => {
          if (item.show) {
            const column = defaultColumns.find((column) => column.field === item.field);
            newSelectedColumns.push(column);
          }
        });
        return newSelectedColumns;
      } else {
        const fieldColumns = defaultColumns.map((item) => {
          return {
            field: item.field,
            name: item.name,
            show: true,
          };
        });
        this.setTableColumnsSelected(fieldColumns);
        return defaultColumns;
      }
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
              <WzButtonPermissions
                buttonType="empty"
                permissions={[{ action: 'agent:create', resource: '*:*:*' }]}
                iconType="plusInCircle"
                onClick={() => this.props.addingNewAgent()}
              >
                Deploy new agent
              </WzButtonPermissions>
            </EuiFlexItem>
            {formattedButton}
          </EuiFlexGroup>
          <EuiSpacer size="xs" />
        </div>
      );
    }

    filterBarRender() {
      return (
        <EuiFlexGroup>
          <EuiFlexItem style={{ marginRight: 0 }}>
            <WzSearchBar
              noDeleteFiltersOnUpdateSuggests
              filters={this.state.filters}
              suggestions={this.suggestions}
              onFiltersChange={(filters) => this.setState({ filters, pageIndex: 0 })}
              placeholder="Filter or search agent"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton iconType="refresh" fill={true} onClick={() => this.reloadAgents()}>
              Refresh
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }

    selectColumnsRender() {
      const columnsSelected = this.getTableColumnsSelected();

      const onChange = (optionId) => {
        let item = columnsSelected.find((item) => item.field === optionId);
        item.show = !item.show;
        this.setTableColumnsSelected(columnsSelected);
        this.forceUpdate();
      };

      const options = () => {
        return columnsSelected.map((item) => {
          return {
            id: item.field,
            label: item.name,
            checked: item.show,
          };
        });
      };

      return this.state.isFilterColumnOpen ? (
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiCheckboxGroup
              options={options()}
              onChange={onChange}
              className="columnsSelectedCheckboxs"
              idToSelectedMap={{}}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : (
        ''
      );
    }

    tableRender() {
      const getRowProps = (item) => {
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
          onMouseDown: (ev) => {
            AppNavigate.navigateToModule(ev, 'agents', { tab: 'welcome', agent: item.id });
            ev.stopPropagation();
          },
        };
      };

      const {
        pageIndex,
        pageSize,
        totalItems,
        agents,
        sortField,
        sortDirection,
        isLoading,
      } = this.state;
      const columns = this.columns();
      const pagination =
        totalItems > 15
          ? {
              pageIndex: pageIndex,
              pageSize: pageSize,
              totalItemCount: totalItems,
              pageSizeOptions: [15, 25, 50, 100],
            }
          : false;
      const sorting = {
        sort: {
          field: sortField,
          direction: sortDirection,
        },
      };

      const selection = {
        selectable: (agent) => agent.id,
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

    filterGroupBadge = (group) => {
      const { filters } = this.state;
      let auxFilters = filters.map((filter) => filter.value.match(/group=(.*S?)/)[1]);
      if (filters.length > 0) {
        !auxFilters.includes(group)
          ? this.setState({
              filters: [...filters, { field: 'q', value: `group=${group}` }],
            })
          : false;
      } else {
        this.setState({
          filters: [...filters, { field: 'q', value: `group=${group}` }],
        });
      }
    };

    renderGroups(groups) {
      return (
        <GroupTruncate
          groups={groups}
          length={25}
          label={'more'}
          action={'filter'}
          filterAction={this.filterGroupBadge}
          {...this.props}
        />
      );
    }

    render() {
      const { allSelected, purgeModal, selectedItems, loadingAllItem } = this.state;
      const title = this.headRender();
      const filter = this.filterBarRender();
      const selectColumnsRender = this.selectColumnsRender();
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
              title={allSelected ? 'Delete all agents' : `Delete ${selectedItems.length} agents`}
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
            {selectColumnsRender}
            {table}
            {renderPurgeModal}
          </EuiPanel>
        </div>
      );
    }
  }
);

AgentsTable.propTypes = {
  wzReq: PropTypes.func,
  addingNewAgent: PropTypes.func,
  downloadCsv: PropTypes.func,
  clickAction: PropTypes.func,
  timeService: PropTypes.func,
  reload: PropTypes.func,
};

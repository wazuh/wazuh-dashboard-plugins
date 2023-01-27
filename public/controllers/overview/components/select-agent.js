/*
 * Wazuh app - React component for alerts stats.
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
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiButton,
  EuiFlexGroup,
  EuiTitle,
  EuiFlexItem,
  EuiBasicTable
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { withErrorBoundary } from '../../../components/common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';

export const SelectAgent = withErrorBoundary (class SelectAgent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isFlyoutVisible: false,
      isSwitchChecked: true
    };

    this.closeFlyout = this.closeFlyout.bind(this);
    this.showFlyout = this.showFlyout.bind(this);

    const selectedOptions = JSON.parse(
      sessionStorage.getItem('agents_preview_selected_options')
    );

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
      totalItems: 0
    };
  }

  async componentDidMount() {
    await this.getItems();
  }

  formatAgent(agent) {
    const checkField = field => {
      return field !== undefined ? field : '-';
    };

    const agentVersion =
      agent.version !== undefined ? agent.version.split(' ')[1] : '.';

    return {
      id: agent,
      name: agent.name,
      ip: agent.ip,
      status: agent.status,
      group: checkField(agent.group),
      os_name: agent,
      version: agentVersion,
      dateAdd: agent.dateAdd,
      lastKeepAlive: agent.lastKeepAlive,
      actions: agent
    };
  }

  async getItems() {
    try {
      const rawAgents = await WzRequest.apiReq('GET', '/agents', this.buildFilter());
      const formattedAgents = (((rawAgents || {}).data || {}).data || {}).items.map(
        this.formatAgent.bind(this)
      );

      this.setState({
        agents: formattedAgents,
        totalItems: (((rawAgents || {}).data || {}).data || {}).totalItems,
      });
    } catch (error) {
      const options = {
        context: `${SelectAgent.name}.getItems`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    } finally {
      this.setState({
        isProcessing: false,
        isLoading: false,
      });
    }
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

  onSwitchChange = () => {
    this.setState({
      isSwitchChecked: !this.state.isSwitchChecked
    });
  };

  closeFlyout() {
    this.setState({ isFlyoutVisible: false });
  }

  showFlyout() {
    this.setState({ isFlyoutVisible: true });
  }

  columns() {
    return [
      {
        field: 'name',
        name: 'Name',
        sortable: true,
        truncateText: true
      },
      {
        field: 'ip',
        name: 'IP address',
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
      }
    ];
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

  tableRender() {
    const {
      pageIndex,
      pageSize,
      totalItems,
      agents,
      sortField,
      sortDirection
    } = this.state;
    const columns = this.columns();
    const pagination = {
      pageIndex: pageIndex,
      pageSize: pageSize,
      totalItemCount: totalItems,
      pageSizeOptions: [10, 25, 50, 100]
    };
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
            pagination={pagination}
            onChange={this.onTableChange}
            sorting={sorting}
            loading={isLoading}
            noItemsMessage="No agents found"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  render() {
    let flyout;

    const table = this.tableRender();

    if (this.state.isFlyoutVisible) {
      flyout = (
        <EuiFlyout className="wzApp" onClose={this.closeFlyout} aria-labelledby="flyoutTitle">
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="m">
              <h2 id="flyoutTitle">Select agent</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>{table}</EuiFlyoutBody>
        </EuiFlyout>
      );
    }

    return (
      <div>
        <EuiButton onClick={this.showFlyout}>Select agent</EuiButton>

        {flyout}
      </div>
    );
  }
});

SelectAgent.propTypes = {
  items: PropTypes.array
};

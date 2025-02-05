/*
 * Wazuh app - React component for building the agents preview section.
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
import { EuiSpacer } from '@elastic/eui';
import { AgentsTable } from './table/agents-table';
import {
  withGlobalBreadcrumb,
  withUserAuthorizationPrompt,
  withErrorBoundary,
} from '../common/hocs';
import { compose } from 'redux';
import { endpointSummary } from '../../utils/applications';
import './endpoints-summary.scss';
import { EndpointsSummaryDashboard } from './dashboard/endpoints-summary-dashboard';

export const EndpointsSummary = compose(
  withErrorBoundary,
  withGlobalBreadcrumb([{ text: endpointSummary.breadcrumbLabel }]),
  withUserAuthorizationPrompt([
    [
      { action: 'agent:read', resource: 'agent:id:*' },
      { action: 'agent:read', resource: 'agent:group:*' },
    ],
  ]),
)(
  class EndpointsSummary extends Component {
    _isMount = false;
    constructor(props) {
      super(props);
      this.state = {
        agentTableFilters: {},
        reload: 0,
      };
      this.filterAgentByStatus = this.filterAgentByStatus.bind(this);
      this.filterAgentByOS = this.filterAgentByOS.bind(this);
      this.filterAgentByGroup = this.filterAgentByGroup.bind(this);
    }

    setReload = (newValue: number) => {
      this.setState({
        reload: newValue,
      });
    };

    async componentDidMount() {
      this._isMount = true;
    }

    componentWillUnmount() {
      this._isMount = false;
    }

    groupBy = function (arr) {
      return arr.reduce(function (prev, item) {
        if (item in prev) prev[item]++;
        else prev[item] = 1;
        return prev;
      }, {});
    };

    filterAgentByStatus(item: any) {
      this._isMount &&
        this.setState({
          agentTableFilters: { q: `id!=000;status=${item.status}` },
        });
    }

    filterAgentByOS(item: any) {
      const query =
        item.label === 'N/A'
          ? 'id!=000;os.platform=null'
          : `id!=000;os.platform~${item.label}`;
      this._isMount &&
        this.setState({
          agentTableFilters: { q: query },
        });
    }

    filterAgentByGroup(item: any) {
      const query =
        item.label === 'N/A'
          ? 'id!=000;group=null'
          : `id!=000;group=${item.label}`;
      this._isMount &&
        this.setState({
          agentTableFilters: { q: query },
        });
    }

    render() {
      return (
        <>
          <EndpointsSummaryDashboard
            filterAgentByStatus={this.filterAgentByStatus}
            filterAgentByOS={this.filterAgentByOS}
            filterAgentByGroup={this.filterAgentByGroup}
            reloadDashboard={this.state.reload}
          />
          <EuiSpacer size='m' />
          <AgentsTable
            filters={this.state.agentTableFilters}
            externalReload={this.state.reload}
            setExternalReload={this.setReload}
          />
        </>
      );
    }
  },
);

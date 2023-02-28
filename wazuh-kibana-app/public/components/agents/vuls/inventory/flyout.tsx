/*
 * Wazuh app - Agent vulnerabilities components
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
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiLoadingContent,
  EuiCallOut,
} from '@elastic/eui';
import { Details } from './detail';
import { AppState } from '../../../../react-services/app-state';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { WzRequest } from '../../../../react-services/wz-request';

export class FlyoutDetail extends Component {
  state: {
    currentItem: boolean | { [key: string]: string };
    clusterFilter: {};
    isLoading: boolean;
    error: boolean;
  };

  props!: {
    vulName: string;
    agentId: string;
    view: 'inventory' | 'events' | 'extern';
    closeFlyout(): void;
  };

  constructor(props) {
    super(props);
    this.state = {
      currentItem: false,
      clusterFilter: {},
      isLoading: true,
      error: false,
    };
  }

  async getLastScan() {
    const response = await WzRequest.apiReq(
      'GET',
      `/vulnerability/${this.props.agentId}/last_scan`,
      {}
    );
    return ((response.data || {}).data || {}).affected_items[0] || {};
  }

  async componentDidMount() {
    try {
      const isCluster = (AppState.getClusterInfo() || {}).status === 'enabled';
      const clusterFilter = isCluster
        ? { 'cluster.name': AppState.getClusterInfo().cluster }
        : { 'manager.name': AppState.getClusterInfo().manager };
      this.setState({ clusterFilter });
      const currentItem = this.props.item;

      if (!currentItem) {
        throw new Error('Vulnerability not found');
      }

      const lastScan = await this.getLastScan();
      Object.assign(currentItem, { ...lastScan });

      this.setState({ currentItem, isLoading: false });
    } catch (error) {
      const options: UIErrorLog = {
        context: `${FlyoutDetail.name}.componentDidMount`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
        error: {
          error: error,
          message: `Data could not be fetched for ${this.props.vulName}`,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
      this.setState({
        error: `Data could not be fetched for ${this.props.vulName}`,
      });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  render() {
    const { currentItem } = this.state;
    const title = `${currentItem.cve || ''}`;
    const id = title.replace(/ /g, '_');
    const filterMap = {
      name: 'data.vulnerability.package.name',
      cve: 'data.vulnerability.cve',
      architecture: 'data.vulnerability.package.architecture',
      version: 'data.vulnerability.package.version'
    };
    const implicitFilters = [
      { 'rule.groups': 'vulnerability-detector' },
      { 'agent.id': this.props.agentId },
      this.state.clusterFilter,
      ...Object.keys(filterMap)
        .map((key) => {
          if (currentItem[key]) {
            return { [filterMap[key]]: currentItem[key] };
          }
        })
        .filter((item) => item),
    ];

    return (
      <EuiFlyout
        onClose={() => this.props.closeFlyout()}
        size="l"
        aria-labelledby={title}
        maxWidth="70%"
        className="wz-inventory wzApp"
      >
        <EuiFlyoutHeader hasBorder className="flyout-header">
          <EuiTitle size="s">
            <h2 id={id}>{title}</h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        {this.state.isLoading && (
          <EuiFlyoutBody className="flyout-body">
            {(this.state.error && (
              <EuiCallOut title={this.state.error} color="warning" iconType="alert" />
            )) || <EuiLoadingContent style={{ margin: 16 }} />}
          </EuiFlyoutBody>
        )}
        {currentItem && !this.state.isLoading && (
          <EuiFlyoutBody className="flyout-body">
            <Details currentItem={currentItem} {...this.props} implicitFilters={implicitFilters} />
          </EuiFlyoutBody>
        )}
      </EuiFlyout>
    );
  }
}

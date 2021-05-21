/*
 * Wazuh app - Agent vulnerabilities components
 * Copyright (C) 2015-2021 Wazuh, Inc.
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

  async componentDidMount() {
    try {
      const isCluster = (AppState.getClusterInfo() || {}).status === 'enabled';
      const clusterFilter = isCluster
        ? { 'cluster.name': AppState.getClusterInfo().cluster }
        : { 'manager.name': AppState.getClusterInfo().manager };
      this.setState({ clusterFilter });
      const currentItem = this.props.item;

      if (!currentItem) {
        throw false;
      }
      this.setState({ currentItem, isLoading: false });
    } catch (err) {
      this.setState({
        error: `Data could not be fetched for ${this.props.vulName}`,
      });
    }
  }

  render() {
    const { currentItem } = this.state;
    const title = `${currentItem.cve}`;
    const id = title.replace(/ /g, '_');

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
            <Details
              currentItem={currentItem}
              {...this.props}
              implicitFilters={[
                { 'rule.groups': 'vulnerability-detector' },
                { 'data.vulnerability.package.name': currentItem.name },
                { 'data.vulnerability.cve': currentItem.cve },
                { 'data.vulnerability.package.architecture': currentItem.architecture },
                { 'data.vulnerability.package.version': currentItem.version },
                { 'agent.id': this.props.agentId },
                this.state.clusterFilter,
              ]}
            />
          </EuiFlyoutBody>
        )}
      </EuiFlyout>
    );
  }
}

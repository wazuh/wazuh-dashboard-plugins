/*
 * Wazuh app - Integrity monitoring components
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
} from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { FileDetails } from './fileDetail';
import { AppState } from '../../../../react-services/app-state';
export class FlyoutDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentFile: false,
      clusterFilter: {}
    }
  }

  async componentDidMount() {
    const isCluster = (AppState.getClusterInfo() || {}).status === "enabled";
    const clusterFilter = isCluster
      ? { "cluster.name": AppState.getClusterInfo().cluster }
      : { "manager.name": AppState.getClusterInfo().manager };
    this.setState({ clusterFilter });
    const data = await WzRequest.apiReq('GET', `/syscheck/${this.props.agentId}`, { file: this.props.fileName });
    const currentFile = ((((data || {}).data || {}).data || {}) .items || [])[0];
    this.setState({ currentFile });
  }

  render() {
    return (
      <Fragment>
        {this.state.currentFile &&
          <EuiFlyout onClose={() => this.props.closeFlyout()} size="l" aria-labelledby="flyoutTitle" maxWidth="70%">
            <EuiFlyoutHeader hasBorder className="flyout-header" >
              <EuiTitle size="s">
                <h2 id="flyoutTitle">{this.state.currentFile.file}</h2>
              </EuiTitle>
            </EuiFlyoutHeader>
            <EuiFlyoutBody className="flyout-body" >
              <FileDetails currentFile={this.state.currentFile} {...this.props} implicitFilters={[{ 'rule.groups': "syscheck" }, { 'syscheck.path': this.state.currentFile.file }, { 'agent.id': this.props.agentId }, this.state.clusterFilter]} />
            </EuiFlyoutBody>
          </EuiFlyout>
        }
      </Fragment >
    )
  }
}

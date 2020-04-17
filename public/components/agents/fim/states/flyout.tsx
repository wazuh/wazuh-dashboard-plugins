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
  EuiLoadingContent
} from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { FileDetails } from './fileDetail';
import { AppState } from '../../../../react-services/app-state';
export class FlyoutDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentFile: false,
      clusterFilter: {},
      isLoading: true,
      error: false
    }
  }

  async componentDidMount() {
    try{
      const isCluster = (AppState.getClusterInfo() || {}).status === "enabled";
      const clusterFilter = isCluster
        ? { "cluster.name": AppState.getClusterInfo().cluster }
        : { "manager.name": AppState.getClusterInfo().manager };
      this.setState({ clusterFilter });
      const data = await WzRequest.apiReq('GET', `/syscheck/${this.props.agentId}`, { file: this.props.fileName });
      const currentFile = ((((data || {}).data || {}).data || {}) .items || [])[0];
      this.setState({ currentFile, isLoading: false });
    }catch(err){
      this.setState({error: `Data could not be fetched for ${this.props.fileName}`})
    }
  }

  render() {
    return (
          <EuiFlyout onClose={() => this.props.closeFlyout()} size="l" aria-labelledby="flyoutTitle" maxWidth="70%">
            {this.state.isLoading && (
              <Fragment>
              <EuiFlyoutHeader hasBorder className="flyout-header" >
                <EuiTitle size="s">
                  <h2 id="flyoutTitle">{this.props.fileName}</h2>
                </EuiTitle>
              </EuiFlyoutHeader>
              <EuiFlyoutBody className="flyout-body" > 
               {this.state.error && (<div>{this.state.error}</div>)  || (<EuiLoadingContent style={{ margin: 16 }} />) } 
              </EuiFlyoutBody>
            </Fragment>
            )}
            {this.state.currentFile && !this.state.isLoading &&
              <Fragment>
                <EuiFlyoutHeader hasBorder className="flyout-header" >
                  <EuiTitle size="s">
                    <h2 id="flyoutTitle">{this.state.currentFile.file}</h2>
                  </EuiTitle>
                </EuiFlyoutHeader>
                <EuiFlyoutBody className="flyout-body" > 
                  <FileDetails currentFile={this.state.currentFile} {...this.props} implicitFilters={[{ 'rule.groups': "syscheck" }, { 'syscheck.path': this.state.currentFile.file }, { 'agent.id': this.props.agentId }, this.state.clusterFilter]} />
                </EuiFlyoutBody>
              </Fragment>
            }
          </EuiFlyout>
    )
  }
}

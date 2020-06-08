/*
 * Wazuh app - React component information about last SCA scan.
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

import React, { Component, Fragment } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiText,
  EuiLink,
  EuiBadge,
  EuiStat,
  EuiSpacer,
  EuiLoadingSpinner,
  EuiButtonIcon,
  EuiToolTip,
  EuiBasicTable
} from '@elastic/eui';
import { WzRequest } from '../../../../../react-services/wz-request';

export class ScaScan extends Component {
  _isMount = false;
  props!: {
    [key: string]: any
  }
  state: {
    lastScan: {
      [key: string]: any
    },
    isLoading: Boolean,
  }

  constructor(props) {
    super(props);
    this.state = {
      lastScan: {},
      isLoading: true,
    };
  }

  async componentDidMount() {
    this._isMount = true;
    this.getLastScan(this.props.agentId);
  }

  async getLastScan(agentId: Number) {
    const scans = await WzRequest.apiReq('GET', `/sca/${agentId}?sort=-end_scan`, {limit: 1});
    this._isMount &&
      this.setState({
        lastScan: (((scans.data || {}).data || {}).items || {})[0],
        isLoading: false,
      });
  }

  renderLoadingStatus() {
    const { isLoading } = this.state;
    if (!isLoading) {  
     return;
		} else {
      return(
        <EuiFlexGroup justifyContent="center" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner size="xl" />
          </EuiFlexItem>
        </EuiFlexGroup>
      )
		}
  }

  renderScanDetails() {
    const { isLoading, lastScan } = this.state;
    if (isLoading || lastScan == []) return;
    return(
      <Fragment>
        <EuiText size="xs">
          <h2>SCA: Last scan</h2>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiTitle size="s">
              <EuiLink onClick={() => this.props.switchTab('sca')}>
                <h3>{lastScan.name}</h3>
              </EuiLink>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ marginTop: 15 }}>
            <EuiBadge color="secondary">{lastScan.policy_id}</EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText>
              <p>{lastScan.description}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xl" />
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiStat
              title={lastScan.pass}
              textAlign="center"
              description="Pass"
              titleColor="secondary"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={lastScan.fail}
              textAlign="center"
              description="Fail"
              titleColor="danger"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={lastScan.total_checks}
              textAlign="center"
              description="Total checks"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={`${lastScan.score}%`}
              textAlign="center"
              description="Score"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xxl" />
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText textAlign="center">
              <span>{`Start Scan: ${lastScan.start_scan} - End Scan: ${lastScan.end_scan}`}</span>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    )
  }


  render() {
    const loading = this.renderLoadingStatus();
    const scaScan = this.renderScanDetails();
    return (
      <EuiFlexItem style={{ marginTop: 0 }}>
        <EuiPanel paddingSize="m">
          {loading}
          {scaScan}
        </EuiPanel>
      </EuiFlexItem>
    )
  }
}
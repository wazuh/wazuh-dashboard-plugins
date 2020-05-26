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
  EuiLoadingChart,
  EuiButtonIcon,
  EuiToolTip,
  EuiEmptyPrompt
} from '@elastic/eui';
import chrome from 'ui/chrome';
import store from '../../../../../redux/store';
import { updateCurrentAgentData } from '../../../../../redux/actions/appStateActions';
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
    const $injector = await chrome.dangerouslyGetActiveInjector();
    this.router = $injector.get('$route');
    this.getLastScan(this.props.agent.id);
  }

  async getLastScan(agentId: Number) {
    const scans = await WzRequest.apiReq('GET', `/sca/${agentId}?sort=-end_scan`, { limit: 1 });
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
      return (
        <EuiFlexGroup justifyContent="center" alignItems="center">
          <EuiFlexItem grow={false}>
            <div style={{ display: 'block', textAlign: "center", paddingTop: 100 }}>
              <EuiLoadingChart size="xl" />
            </div>
          </EuiFlexItem>
        </EuiFlexGroup>
      )
    }
  }

  renderScanDetails() {
    const { isLoading, lastScan } = this.state;
    if (isLoading || lastScan === undefined) return;
    return (
      <Fragment>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiTitle size="s">
              <EuiLink onClick={() => {
                window.location.href = `#/overview?tab=sca&redirectPolicy=${lastScan.policy_id}`;
                store.dispatch(updateCurrentAgentData(this.props.agent));
                this.router.reload();
              }
              }>
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
            <EuiText size={'s'}>
              <p>{lastScan.description}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="l" />
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiStat
              title={lastScan.pass}
              titleSize="m"
              textAlign="center"
              description="Pass"
              titleColor="secondary"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={lastScan.fail}
              titleSize="m"
              textAlign="center"
              description="Fail"
              titleColor="danger"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={lastScan.total_checks}
              titleSize="m"
              textAlign="center"
              description="Total checks"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={`${lastScan.score}%`}
              titleSize="m"
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


  renderEmptyPrompt() {
    const { isLoading } = this.state;
    if (isLoading) return;
    return (
      <Fragment>
        <EuiEmptyPrompt
          iconType="visVega"
          title={<h4>You dont have SCA scans in this agent.</h4>}
          body={
            <Fragment>
              <p>
                Check your agent settings to generate scans.
              </p>
            </Fragment>
          }
        />
      </Fragment>
    )
  }

  render() {
    const { lastScan } = this.state;
    const loading = this.renderLoadingStatus();
    const scaScan = this.renderScanDetails();
    const emptyPrompt = this.renderEmptyPrompt();
    return (
      <EuiFlexItem>
        <EuiPanel paddingSize="m">
          <EuiText size="xs">
            <EuiFlexGroup>
              <EuiFlexItem>
                <h2>SCA: Last scan</h2>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiToolTip position="top" content="Open SCA Scans">
                  <EuiButtonIcon
                    iconType="popout"
                    color="primary"
                    onClick={() => {
                      window.location.href = `#/overview?tab=sca`;
                      store.dispatch(updateCurrentAgentData(this.props.agent));
                      this.router.reload();
                    }
                    }
                    aria-label="Open SCA Scans" />
                </EuiToolTip>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiText>
          {lastScan === undefined && emptyPrompt}
          {loading}
          {scaScan}
        </EuiPanel>
      </EuiFlexItem>
    )
  }
}
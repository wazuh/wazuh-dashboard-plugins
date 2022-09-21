/*
 * Wazuh app - React component information about last SCA scan.
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
  EuiEmptyPrompt,
  EuiIcon,
  EuiBasicTable,
} from '@elastic/eui';
import moment from 'moment-timezone';
import store from '../../../../../redux/store';
import { updateCurrentAgentData } from '../../../../../redux/actions/appStateActions';
import { WzRequest } from '../../../../../react-services';
import { formatUIDate } from '../../../../../react-services/time-service';
import { getAngularModule } from '../../../../../kibana-services';
import { withReduxProvider, withUserAuthorizationPrompt } from "../../../hocs";
import { compose } from 'redux';
import { Inventory } from '../../../../../components/agents/sca/index';

export const ScaScan = compose(
  withReduxProvider,
  withUserAuthorizationPrompt([
    [
      {action: 'agent:read', resource: 'agent:id:*'},
      {action: 'agent:read', resource: 'agent:group:*'}
    ],
    [
      {action: 'sca:read', resource: 'agent:id:*'},
      {action: 'sca:read', resource: 'agent:group:*'}
    ]
  ])
)(class ScaScan extends Component {
  _isMount = false;
  props!: {
    [key: string]: any
  }
  state: {
    lastScan: {
      [key: string]: any
    },
    isLoading: Boolean,
    firstTable: Boolean
  }

  constructor(props) {
    super(props);
    this.state = {
      lastScan: {},
      isLoading: true,
      firstTable: true,
    };
  }


  async componentDidMount() {
    this._isMount = true;
    const $injector = getAngularModule().$injector;
    this.router = $injector.get('$route');
    this.getLastScan(this.props.agent.id);
  }

  async getLastScan(agentId: Number) {
    const scans = await WzRequest.apiReq('GET', `/sca/${agentId}?sort=-end_scan`, {params:{ limit: 1} });
    this._isMount &&
      this.setState({
        lastScan: (((scans.data || {}).data || {}).affected_items || {})[0],
        isLoading: false,
      });
  }

  durationScan() {
    const { lastScan }  = this.state;
    const start_scan = moment(lastScan.start_scan);
    const end_scan = moment(lastScan.end_scan);
    let diff = start_scan.diff(end_scan);
    let duration = moment.duration(diff);
    let auxDuration = Math.floor(duration.asHours()) + moment.utc(diff).format(":mm:ss");
    return auxDuration === '0:00:00' ? '< 1s' : auxDuration;
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

  onClickRow(policy_id) {
    window.location.href = `#/overview?tab=sca&redirectRule=${policy_id}`;
                  store.dispatch(updateCurrentAgentData(this.props.agent));
                  this.router.reload();
                  // this.setState({firstTable:false})
                  
  }
  
  // onClickRow(policy_id) {
  //   window.location.href = window.location.href.replace(
  //     new RegExp('redirectRule=' + '[^&]*'),
  //     `redirectRule=${policy_id}`
  //   );
  //   this.setState({ currentRuleId: lastScan.policy_id, isLoading: true });
  // }

  renderScanDetails() {
    const { isLoading, lastScan } = this.state;
    const {agent} = this.props
    if (isLoading || lastScan === undefined) return;


    return (
      <Fragment>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiTitle size="xs">
              <EuiLink onClick={() => {
                  window.location.href = `#/overview?tab=sca&redirectPolicy=${lastScan.policy_id}`;
                  store.dispatch(updateCurrentAgentData(this.props.agent));
                  this.router.reload();
                }
              }>
                <h4>{lastScan.name}</h4>
                {/* <Inventory agent={agent} /> */}
                <EuiSpacer size="m" />
                {/* <EuiPanel paddingSize="l">
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiBasicTable
                        items={this.state.policies}
                        columns={this.columnsPolicies}
                        rowProps={getPoliciesRowProps}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPanel> */}
              </EuiLink>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ marginTop: 12 }}>
            <EuiBadge color="secondary">{lastScan.policy_id}</EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiPanel>

        <Inventory agent={agent} withoutDashboard onClickRow={this.onClickRow} firstTable={this.state.firstTable} />
        </EuiPanel>
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
        <EuiSpacer size={'l'}/>
        <EuiFlexGroup>
          <EuiFlexItem grow={false} style={{ marginTop: 15 }}>
            <EuiText>
              <EuiIcon type="calendar" color={'primary'}/> Start time: {formatUIDate(lastScan.start_scan)}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ marginTop: 15 }}>
            <EuiText>
              <EuiIcon type="clock" color={'primary'}/> Duration: {this.durationScan()}
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
            <EuiFlexItem grow={false}>
            <EuiTitle size="xs">
              <EuiLink className="agents-link-item" onClick={() => {
                  window.location.href = `#/overview?tab=sca&redirectPolicy=${lastScan.policy_id}`;
                  store.dispatch(updateCurrentAgentData(this.props.agent));
                  this.router.reload();
                }
              }>
               <h2>SCA: Lastest scans</h2>
                {/* <Inventory agent={agent} /> */}
              </EuiLink>
            </EuiTitle>
          </EuiFlexItem>
              {/* <EuiFlexItem>
                <h2>SCA: Lastest scans</h2>
              </EuiFlexItem> */}
              {/* <Inventory agent={agent} /> */}
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
});

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
  EuiSpacer,
  EuiLoadingChart,
  EuiButtonIcon,
  EuiToolTip,
  EuiEmptyPrompt,
} from '@elastic/eui';
import moment from 'moment-timezone';
import store from '../../../../../redux/store';
import { updateCurrentAgentData } from '../../../../../redux/actions/appStateActions';
import { WzRequest } from '../../../../../react-services';
import { formatUIDate } from '../../../../../react-services/time-service';
import { getAngularModule } from '../../../../../kibana-services';
import { withReduxProvider, withUserAuthorizationPrompt } from "../../../hocs";
import { compose } from 'redux';
import SCAPoliciesTable from '../../../../agents/sca/inventory/agent-policies-table';
import { MODULE_SCA_CHECK_RESULT_LABEL } from '../../../../../../common/constants';

type Props = {
  agent: { [key in string]: any };
  router: any; // its angular router
}

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
)(class ScaScan extends Component<Props> {
  _isMount = false;
  router;
  state: {
    lastScan: {
      [key: string]: any
    },
    isLoading: Boolean,
    firstTable: Boolean,
    policies: any[],
  }

  constructor(props) {
    super(props);
    this.state = {
      lastScan: {},
      isLoading: true,
      firstTable: true,
      policies: [],
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

  onClickRow = (policy) => {
    window.location.href = `#/overview?tab=sca&redirectPolicyTable=${policy.policy_id}`;
    store.dispatch(updateCurrentAgentData(this.props.agent));
    this.router.reload();                  
  }

  renderScanDetails() {
    const { isLoading, lastScan } = this.state;
    if (isLoading || lastScan === undefined) return;

    const columnsPolicies = [
      {
        field: 'name',
        name: 'Policy',
        width: '40%',
      },
      {
        field: 'end_scan',
        name: 'End scan',
        dataType: 'date',
        render: formatUIDate,
        width: '20%',
      },
      {
        field: 'pass',
        name: MODULE_SCA_CHECK_RESULT_LABEL.passed,
        width: '10%',
      },
      {
        field: 'fail',
        name: MODULE_SCA_CHECK_RESULT_LABEL.failed,
        width: '10%',
      },
      {
        field: 'invalid',
        name: MODULE_SCA_CHECK_RESULT_LABEL['not applicable'],
        width: '10%',
      },
      {
        field: 'score',
        name: 'Score',
        width: '10%',
        render: (score) => {
          return `${score}%`;
        }
      },
    ];

    const tableProps = {
      tablePageSizeOptions: [4],
      hidePerPageOptions: true
    }
 
    return (
      <Fragment>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiTitle size="xs">
              <EuiLink onClick={() => {
                  window.location.href = `#/overview?tab=sca&redirectPolicyTable=${lastScan.policy_id}`;
                  store.dispatch(updateCurrentAgentData(this.props.agent));
                  this.router.reload();
                }
              }>
                <h4>{lastScan.name}</h4>
                <EuiSpacer size="m" />
              </EuiLink>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ marginTop: 12 }}>
            <EuiBadge color="secondary">{lastScan.policy_id}</EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiPanel>
        <SCAPoliciesTable 
          agent={this.props.agent}
          columns={columnsPolicies}
          rowProps={this.onClickRow}
          tableProps={tableProps}
          />
        </EuiPanel>
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
          title={<h4>You don't have SCA scans in this agent.</h4>}
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
            <EuiFlexGroup className="wz-section-sca-euiFlexGroup">
            <EuiFlexItem grow={false}>
            <EuiTitle size="xs">
              <EuiLink className="agents-link-item" onClick={() => {
                  window.location.href = `#/overview?tab=sca&redirectPolicy=${lastScan.policy_id}`;
                  store.dispatch(updateCurrentAgentData(this.props.agent));
                  this.router.reload();
                }
              }>
               <h2>SCA: Lastest scans</h2>
              </EuiLink>
            </EuiTitle>
          </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiToolTip position="top" content="Open SCA Scans">
                  <EuiButtonIcon
                    iconType="popout"
                    color="primary"
                    className='EuiButtonIcon'
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

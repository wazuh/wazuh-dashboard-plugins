/*
 * Wazuh app - Inventory component
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
  EuiFlexItem,
  EuiFlexGroup,
  EuiPanel,
  EuiPage,
  EuiSpacer,
  EuiText,
  EuiProgress,
  EuiTitle,
  EuiButton,
  EuiStat,
  EuiButtonEmpty,
  EuiToolTip,
  EuiCallOut,
  EuiPopover,
  EuiCard,
} from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { formatUIDate } from '../../../../react-services/time-service';
import _ from 'lodash';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../react-services/error-orchestrator/types';
import {
  API_NAME_AGENT_STATUS,
  MODULE_SCA_CHECK_RESULT_LABEL,
  UI_LOGGER_LEVELS,
} from '../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { VisualizationBasic } from '../../../common/charts/visualizations/basic';
import SCAPoliciesTable from '../inventory/agent-policies-table';
import { InventoryPolicyChecksTable } from '../inventory/checks-table';
import { connect } from 'react-redux';
import './dashboard.scss';

type DashboardProps = {
  agent: { [key: string]: any };
  currentAgentData: object;
};

type DashboardState = {
  itemIdToExpandedRowMap: object;
  showMoreInfo: boolean;
  loading: boolean;
  checksIsLoading: boolean;
  filters: object;
  pageTableChecks: { pageIndex: number; pageSize?: number };
  policies: object[];
  lookingPolicy: { [key: string]: any } | boolean;
  loadingPolicy: boolean;
  secondTable: boolean;
  secondTableBack: boolean;
  items: [];
};
class Dashboard extends Component<DashboardProps, DashboardState> {
  _isMount = false;
  agent: { [key: string]: any } = {};
  columnsPolicies: object[];
  lookingPolicy: { [key: string]: any } | false = false;
  constructor(props) {
    super(props);
    this.state = {
      itemIdToExpandedRowMap: {},
      showMoreInfo: false,
      loading: false,
      filters: {},
      pageTableChecks: { pageIndex: 0 },
      policies: [],
      secondTable: false,
      secondTableBack: false,
      checksIsLoading: false,
      lookingPolicy: false,
      loadingPolicy: false,
      items: [],
    };

    this.columnsPolicies = [
      {
        field: 'name',
        name: 'Policy',
        sortable: true,
      },
    ];
  }

  async componentDidMount() {
    this._isMount = true;
    try {
      const regex = new RegExp('redirectPolicy=' + '[^&]*');
      const match = window.location.href.match(regex);

      if (match && match[0]) {
        this.setState({ loading: true });
        const id = match[0].split('=')[1];
        const policy = await WzRequest.apiReq(
          'GET',
          `/sca/${this.props.currentAgentData.id}`,
          {
            q: 'policy_id=' + id,
          },
        );
        await this.loadScaPolicy(
          ((((policy || {}).data || {}).data || {}).items || [])[0],
        );
        await this.initialize();
        window.location.href = window.location.href.replace(
          new RegExp('redirectPolicy=' + '[^&]*'),
          '',
        );
      } else {
        // If there is no redirected policy, automatically load and display the first policy.
        await this.initialize();
        if (this.state.policies.length > 0) {
          await this.loadScaPolicy(this.state.policies[0].policy_id);
        }
      }
    } catch (error) {
      this.setState({ loading: false });

      const options: UIErrorLog = {
        context: `${Dashboard.name}.componentDidMount`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
        error: {
          error: error,
          message: error.message || error,
          title: error.name,
        },
      };
      getErrorOrchestrator().handleError(options);
    } finally {
      this.setState({ loading: false });
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(this.props.agent, prevProps.agent)) {
      this.setState({ lookingPolicy: false }, async () => {
        await this.initialize();
        const firstPolicy = this.state.policies[0];
        if (firstPolicy) {
          await this.loadScaPolicy(firstPolicy.policy_id);
        }
      });
    }
    if (!_.isEqual(this.state.filters, prevState.filters)) {
      this.setState({
        itemIdToExpandedRowMap: {},
        pageTableChecks: {
          pageIndex: 0,
          pageSize: this.state.pageTableChecks.pageSize,
        },
      });
    }

    const regex = new RegExp('redirectPolicy=' + '[^&]*');
    const match = window.location.href.match(regex);
    if (
      match &&
      match[0] &&
      !this.state.secondTable &&
      !this.state.secondTableBack
    ) {
      this.loadScaPolicy(match[0].split('=')[1], true);
      this.setState({ secondTableBack: true, checksIsLoading: true });
    }
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  async initialize() {
    try {
      const {
        data: {
          data: { affected_items: policies },
        },
      } = await WzRequest.apiReq(
        'GET',
        `/sca/${this.props.currentAgentData.id}`,
        {},
      );
      this._isMount && this.setState({ loading: false, policies });
    } catch (error) {
      this.setState({ loading: false, policies: [], lookingPolicy: false });

      const options: UIErrorLog = {
        context: `${Dashboard.name}.initialize`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
        error: {
          error: error,
          message: error.message || error,
          title: error.name,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  async loadScaPolicy(policy, secondTable?) {
    this._isMount &&
      this.setState({
        loadingPolicy: true,
        itemIdToExpandedRowMap: {},
        pageTableChecks: { pageIndex: 0 },
        secondTable: secondTable ? secondTable : false,
      });
    if (policy) {
      try {
        const policyResponse = await WzRequest.apiReq(
          'GET',
          `/sca/${this.props.currentAgentData.id}`,
          {
            params: {
              q: 'policy_id=' + policy,
            },
          },
        );
        const [policyData] = policyResponse.data.data.affected_items;
        this._isMount &&
          this.setState({
            lookingPolicy: policyData,
            loadingPolicy: false,
            checksIsLoading: false,
          });
      } catch (error) {
        this.setState({
          lookingPolicy: policy,
          loadingPolicy: false,
          checksIsLoading: false,
        });
        const options: UIErrorLog = {
          context: `${Dashboard.name}.loadScaPolicy`,
          level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
          severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
          error: {
            error: error,
            message: `The filter contains invalid characters` || error.message,
            title: error.name,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    } else {
      this._isMount &&
        this.setState({
          lookingPolicy: policy,
          loadingPolicy: false,
          items: [],
          checksIsLoading: false,
        });
    }
  }

  buttonStat(text, field, value) {
    return (
      <button
        onClick={() => this.setState({ filters: { q: `${field}=${value}` } })}
      >
        {text}
      </button>
    );
  }

  updateGraphs = policy => {
    this.setState({ lookingPolicy: policy });
  };
  render() {
    // const isLookingPolicyLoading =
    //   this.state.loadingPolicy || !this.state.lookingPolicy;

    console.log(this.state.lookingPolicy, 'this.state.lookingPolicy');
    console.log(this.state.loading, 'this.state.loading');
    const buttonPopover = (
      <EuiButtonEmpty
        iconType='iInCircle'
        aria-label='Help'
        onClick={() =>
          this.setState({ showMoreInfo: !this.state.showMoreInfo })
        }
      ></EuiButtonEmpty>
    );
    if (this.props.currentAgentData.id === undefined) {
      return <div>Loading...</div>;
    } else {
      return (
        <Fragment>
          <div>
            {this.state.loading ||
              (this.state.checksIsLoading && (
                <div style={{ margin: 16 }}>
                  <EuiSpacer size='m' />
                  <EuiProgress size='xs' color='primary' />
                </div>
              ))}
          </div>
          <EuiPage>
            {this.props.currentAgentData.id &&
              (this.props.currentAgentData || {}).status !==
                API_NAME_AGENT_STATUS.NEVER_CONNECTED &&
              !this.state.policies.length &&
              !this.state.loading && (
                <EuiCallOut title='No scans available' iconType='iInCircle'>
                  <EuiButton color='primary' onClick={() => this.initialize()}>
                    Refresh
                  </EuiButton>
                </EuiCallOut>
              )}

            {this.props.currentAgentData.id &&
              (this.props.currentAgentData || {}).status ===
                API_NAME_AGENT_STATUS.NEVER_CONNECTED &&
              !this.state.loading && (
                <EuiCallOut
                  title='Agent has never connected'
                  style={{ width: '100%' }}
                  iconType='iInCircle'
                >
                  <EuiButton color='primary' onClick={() => this.initialize()}>
                    Refresh
                  </EuiButton>
                </EuiCallOut>
              )}
            {this.props.currentAgentData?.id &&
              (this.props.currentAgentData || {}).os &&
              this.state.policies.length > 0 &&
              !this.state.loading &&
              !this.state.checksIsLoading &&
              this.state.lookingPolicy && (
                <div className='sca-module-wrapper-donut'>
                  {this.state.policies.length && (
                    <EuiFlexGroup
                      style={{
                        marginTop: 0,
                        flexDirection: 'column',
                        height: '100%',
                      }}
                    >
                      <EuiFlexItem grow={false} className='hi'>
                        <EuiCard
                          title
                          description
                          betaBadgeLabel={this.state.lookingPolicy.name}
                          className='sca-module-card-visualization'
                        >
                          <VisualizationBasic
                            type='donut'
                            size={{ width: '100%', height: '150px' }}
                            data={
                              this.state.lookingPolicy
                                ? [
                                    {
                                      label:
                                        MODULE_SCA_CHECK_RESULT_LABEL.passed,
                                      value: this.state.lookingPolicy.pass,
                                      color: '#00a69b',
                                    },
                                    {
                                      label:
                                        MODULE_SCA_CHECK_RESULT_LABEL.failed,
                                      value: this.state.lookingPolicy.fail,
                                      color: '#ff645c',
                                    },
                                    {
                                      label:
                                        MODULE_SCA_CHECK_RESULT_LABEL[
                                          'not applicable'
                                        ],
                                      value: this.state.lookingPolicy.invalid,
                                      color: '#5c6773',
                                    },
                                  ]
                                : []
                            }
                            showLegend
                            noDataTitle='No results'
                            noDataMessage='No results were found.'
                          />
                          <EuiSpacer size='m' />
                        </EuiCard>
                      </EuiFlexItem>

                      <EuiFlexItem
                        style={{
                          marginBottom: 0,
                        }}
                      >
                        <EuiPanel className='sca-module-panel-policies-table'>
                          <SCAPoliciesTable
                            agent={this.props.currentAgentData}
                            columns={this.columnsPolicies}
                            rowProps={policy => {
                              this.updateGraphs(policy);
                            }}
                          />
                        </EuiPanel>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  )}
                </div>
              )}
            {this.props.currentAgentData.id &&
              (this.props.currentAgentData || {}).os &&
              this.state.lookingPolicy &&
              (!this.state.loading || !this.state.checksIsLoading) && (
                <div style={{ marginTop: '12px' }}>
                  <EuiPanel paddingSize='l'>
                    <EuiFlexGroup>
                      <EuiFlexItem>
                        <EuiTitle size='s'>
                          <h2>
                            {this.state.lookingPolicy.name}&nbsp;
                            <EuiToolTip
                              position='right'
                              content='Show policy checksum'
                            >
                              <EuiPopover
                                button={buttonPopover}
                                isOpen={this.state.showMoreInfo}
                                closePopover={() =>
                                  this.setState({ showMoreInfo: false })
                                }
                              >
                                <EuiFlexItem style={{ width: 700 }}>
                                  <EuiSpacer size='s' />
                                  <EuiText>
                                    <b>Policy description:</b>{' '}
                                    {this.state.lookingPolicy.description}
                                    <br></br>
                                    <b>Policy checksum:</b>{' '}
                                    {this.state.lookingPolicy.hash_file}
                                  </EuiText>
                                </EuiFlexItem>
                              </EuiPopover>
                            </EuiToolTip>
                          </h2>
                        </EuiTitle>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiSpacer size='m' />
                    <EuiFlexGroup>
                      <EuiFlexItem>
                        <EuiStat
                          title={this.buttonStat(
                            this.state.lookingPolicy.pass,
                            'result',
                            'passed',
                          )}
                          description={MODULE_SCA_CHECK_RESULT_LABEL.passed}
                          titleColor='secondary'
                          titleSize='m'
                          textAlign='center'
                        />
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <EuiStat
                          title={this.buttonStat(
                            this.state.lookingPolicy.fail,
                            'result',
                            'failed',
                          )}
                          description={MODULE_SCA_CHECK_RESULT_LABEL.failed}
                          titleColor='danger'
                          titleSize='m'
                          textAlign='center'
                        />
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <EuiStat
                          title={this.buttonStat(
                            this.state.lookingPolicy.invalid,
                            'result',
                            'not applicable',
                          )}
                          description={
                            MODULE_SCA_CHECK_RESULT_LABEL['not applicable']
                          }
                          titleColor='subdued'
                          titleSize='m'
                          textAlign='center'
                        />
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <EuiStat
                          title={`${this.state.lookingPolicy.score}%`}
                          description='Score'
                          titleColor='accent'
                          titleSize='m'
                          textAlign='center'
                        />
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <EuiStat
                          title={formatUIDate(
                            this.state.lookingPolicy.end_scan,
                          )}
                          description='End scan'
                          titleColor='primary'
                          titleSize='s'
                          textAlign='center'
                          style={{ padding: 5 }}
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiSpacer size='m' />
                    <EuiFlexGroup>
                      <EuiFlexItem>
                        <InventoryPolicyChecksTable
                          agent={this.props.currentAgentData}
                          filters={this.state.filters}
                          lookingPolicy={this.state.lookingPolicy}
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiPanel>
                </div>
              )}
          </EuiPage>
        </Fragment>
      );
    }
  }
}

const mapStateToProps = state => ({
  currentAgentData: state.appStateReducers.currentAgentData,
});

export default connect(mapStateToProps)(Dashboard);

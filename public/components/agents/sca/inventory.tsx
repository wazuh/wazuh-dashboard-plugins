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
  EuiButtonIcon,
  EuiStat,
  EuiButtonEmpty,
  EuiToolTip,
  EuiCallOut,
  EuiPopover,
  EuiCard,
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { formatUIDate } from '../../../react-services/time-service';
import { getToasts } from '../../../kibana-services';
import _ from 'lodash';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../react-services/error-orchestrator/types';
import {
  API_NAME_AGENT_STATUS,
  MODULE_SCA_CHECK_RESULT_LABEL,
  UI_LOGGER_LEVELS,
} from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { VisualizationBasic } from '../../common/charts/visualizations/basic';
import { AppNavigate } from '../../../react-services/app-navigate';
import SCAPoliciesTable from './inventory/agent-policies-table';
import { InventoryPolicyChecksTable } from './inventory/checks-table';
import { RuleText } from './components';

type InventoryProps = {
  agent: { [key: string]: any };
};

type InventoryState = {
  itemIdToExpandedRowMap: object;
  showMoreInfo: boolean;
  loading: boolean;
  checksIsLoading: boolean;
  redirect: boolean;
  filters: object[];
  pageTableChecks: { pageIndex: number; pageSize?: number };
  policies: object[];
  checks: object[];
  lookingPolicy: { [key: string]: any } | boolean;
  loadingPolicy: boolean;
  secondTable: boolean;
  secondTableBack: boolean;
};
export class Inventory extends Component<InventoryProps, InventoryState> {
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
      filters: [],
      pageTableChecks: { pageIndex: 0 },
      policies: [],
      checks: [],
      redirect: false,
      secondTable: false,
      secondTableBack: false,
      checksIsLoading: false,
      lookingPolicy: false,
      loadingPolicy: false,
    };

    this.columnsPolicies = [
      {
        field: 'name',
        name: 'Policy',
        sortable: true,
      },
      {
        field: 'description',
        name: 'Description',
        truncateText: true,
        sortable: true,
      },
      {
        field: 'end_scan',
        name: 'End scan',
        dataType: 'date',
        render: formatUIDate,
        sortable: true,
      },
      {
        field: 'pass',
        name: MODULE_SCA_CHECK_RESULT_LABEL.passed,
        width: '100px',
        sortable: true,
      },
      {
        field: 'fail',
        name: MODULE_SCA_CHECK_RESULT_LABEL.failed,
        width: '100px',
        sortable: true,
      },
      {
        field: 'invalid',
        name: MODULE_SCA_CHECK_RESULT_LABEL['not applicable'],
        width: '100px',
        sortable: true,
      },
      {
        field: 'score',
        name: 'Score',
        render: score => {
          return `${score}%`;
        },
        width: '100px',
      },
    ];
  }

  async componentDidMount() {
    this._isMount = true;
    await this.initialize();
    const regex = new RegExp('redirectPolicy=' + '[^&]*');
    const match = window.location.href.match(regex);
    try {
      if (match && match[0]) {
        this.setState({ loading: true });
        const id = match[0].split('=')[1];
        const policy = await WzRequest.apiReq(
          'GET',
          `/sca/${this.props.agent.id}`,
          {
            q: 'policy_id=' + id,
          },
        );
        await this.loadScaPolicy(
          ((((policy || {}).data || {}).data || {}).items || [])[0],
        );
        window.location.href = window.location.href.replace(
          new RegExp('redirectPolicy=' + '[^&]*'),
          '',
        );
        this.setState({ loading: false });
      }
    } catch (error) {
      this.setState({ loading: false });

      const options: UIErrorLog = {
        context: `${Inventory.name}.componentDidMount`,
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

  async componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(this.props.agent, prevProps.agent)) {
      this.setState(
        { lookingPolicy: false },
        async () => await this.initialize(),
      );
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

    const regex = new RegExp('redirectPolicyTable=' + '[^&]*');
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
      this._isMount && this.setState({ loading: true });
      this.lookingPolicy = false;
      const {
        data: {
          data: { affected_items: policies },
        },
      } = await WzRequest.apiReq('GET', `/sca/${this.props.agent.id}`, {});
      this._isMount && this.setState({ loading: false, policies });
    } catch (error) {
      this.setState({ loading: false, policies: [] });

      const options: UIErrorLog = {
        context: `${Inventory.name}.initialize`,
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

  handleBack(ev) {
    AppNavigate.navigateToModule(ev, 'agents', {
      tab: 'welcome',
      agent: this.props.agent.id,
    });
    ev.stopPropagation();
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
          `/sca/${this.props.agent.id}`,
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
          context: `${Inventory.name}.loadScaPolicy`,
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

  toggleDetails = item => {
    const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };

    if (itemIdToExpandedRowMap[item.id]) {
      delete itemIdToExpandedRowMap[item.id];
    } else {
      let checks = '';
      checks += (item.rules || []).length > 1 ? 'Checks' : 'Check';
      checks += item.condition ? ` (Condition: ${item.condition})` : '';
      const complianceText =
        item.compliance && item.compliance.length
          ? item.compliance.map(el => `${el.key}: ${el.value}`).join('\n')
          : '';
      const listItems = [
        {
          title: 'Check not applicable due to:',
          description: item.reason,
        },
        {
          title: 'Rationale',
          description: item.rationale || '-',
        },
        {
          title: 'Remediation',
          description: item.remediation || '-',
        },
        {
          title: 'Description',
          description: item.description || '-',
        },
        {
          title: (item.directory || '').includes(',') ? 'Paths' : 'Path',
          description: item.directory,
        },
        {
          title: checks,
          description: <RuleText rules={item.rules.length ? item.rules : []} />,
        },
        {
          title: 'Compliance',
          description: <ComplianceText complianceText={complianceText} />,
        },
      ];
      const itemsToShow = listItems.filter(x => {
        return x.description;
      });
      itemIdToExpandedRowMap[item.id] = (
        <EuiDescriptionList listItems={itemsToShow} />
      );
    }
    this.setState({ itemIdToExpandedRowMap });
  };

  showToast = (color, title, time) => {
    getToasts().add({
      color: color,
      title: title,
      toastLifeTimeMs: time,
    });
  };

  buttonStat(text, field, value) {
    return (
      <button onClick={() => this.setState({ filters: [{ field, value }] })}>
        {text}
      </button>
    );
  }

  onChangeTableChecks({ page: { index: pageIndex, size: pageSize } }) {
    this.setState({ pageTableChecks: { pageIndex, pageSize } });
  }

  render() {
    const { onClickRow } = this.props;

    const handlePoliciesTableClickRow = async policy => {
      onClickRow
        ? onClickRow(policy)
        : await this.loadScaPolicy(policy.policy_id);
      this.setState({ loading: false, redirect: true });
    };

    const buttonPopover = (
      <EuiButtonEmpty
        iconType='iInCircle'
        aria-label='Help'
        onClick={() =>
          this.setState({ showMoreInfo: !this.state.showMoreInfo })
        }
      ></EuiButtonEmpty>
    );
    const { agent } = this.props;

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
          {agent &&
            (agent || {}).status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED &&
            !this.state.policies.length &&
            !this.state.loading && (
              <EuiCallOut title='No scans available' iconType='iInCircle'>
                <EuiButton color='primary' onClick={() => this.initialize()}>
                  Refresh
                </EuiButton>
              </EuiCallOut>
            )}

          {agent &&
            (agent || {}).status === API_NAME_AGENT_STATUS.NEVER_CONNECTED &&
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
          {agent &&
            (agent || {}).os &&
            !this.state.lookingPolicy &&
            this.state.policies.length > 0 &&
            !this.state.loading &&
            !this.state.checksIsLoading && (
              <div>
                {this.state.policies.length && (
                  <EuiFlexGroup style={{ marginTop: 0 }}>
                    {this.state.policies.map((policy: any, idx) => (
                      <EuiFlexItem key={idx} grow={false}>
                        <EuiCard
                          title
                          description
                          betaBadgeLabel={policy.name}
                          style={{ paddingBottom: 0 }}
                        >
                          <VisualizationBasic
                            type='donut'
                            size={{ width: '100%', height: '150px' }}
                            data={[
                              {
                                label: MODULE_SCA_CHECK_RESULT_LABEL.passed,
                                value: policy.pass,
                                color: '#00a69b',
                              },
                              {
                                label: MODULE_SCA_CHECK_RESULT_LABEL.failed,
                                value: policy.fail,
                                color: '#ff645c',
                              },
                              {
                                label:
                                  MODULE_SCA_CHECK_RESULT_LABEL[
                                    'not applicable'
                                  ],
                                value: policy.invalid,
                                color: '#5c6773',
                              },
                            ]}
                            showLegend
                            noDataTitle='No results'
                            noDataMessage='No results were found.'
                          />
                          <EuiSpacer size='m' />
                        </EuiCard>
                      </EuiFlexItem>
                    ))}
                  </EuiFlexGroup>
                )}
                <EuiSpacer size='m' />
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiPanel>
                      <SCAPoliciesTable
                        agent={this.props.agent}
                        columns={this.columnsPolicies}
                        rowProps={handlePoliciesTableClickRow}
                      />
                    </EuiPanel>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </div>
            )}
          {agent &&
            (agent || {}).os &&
            this.state.lookingPolicy &&
            (!this.state.loading || !this.state.checksIsLoading) && (
              <div>
                <EuiPanel paddingSize='l'>
                  <EuiFlexGroup>
                    <EuiFlexItem grow={false}>
                      <EuiButtonIcon
                        color='primary'
                        style={{ padding: '6px 0px' }}
                        onClick={
                          this.state.secondTableBack
                            ? ev => this.handleBack(ev)
                            : () => this.loadScaPolicy(false)
                        }
                        iconType='arrowLeft'
                        aria-label='Back to policies'
                        {...{ iconSize: 'l' }}
                      />
                    </EuiFlexItem>
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
                        title={formatUIDate(this.state.lookingPolicy.end_scan)}
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
                        agent={this.props.agent}
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

Inventory.defaultProps = {
  onClickRow: undefined,
};

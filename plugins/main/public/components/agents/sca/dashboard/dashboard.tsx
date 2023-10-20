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
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
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

class Dashboard extends Component {
  _isMount = false;

  state = {
    itemIdToExpandedRowMap: {},
    showMoreInfo: false,
    loading: false,
    checksIsLoading: false,
    filters: {},
    pageTableChecks: { pageIndex: 0 },
    policies: [],
    secondTable: false,
    secondTableBack: false,
    lookingPolicy: false,
    loadingPolicy: false,
    items: [],
  };

  columnsPolicies = [
    {
      field: 'name',
      name: 'Policy',
      sortable: true,
    },
  ];

  async componentDidMount() {
    this._isMount = true;
    try {
      const regex = new RegExp('redirectPolicy=' + '[^&]*');
      const match = window.location.href.match(regex);

      this.setState({ loading: true });

      if (match && match[0]) {
        const id = match[0].split('=')[1];
        const policy = await WzRequest.apiReq(
          'GET',
          `/sca/${this.props.currentAgentData.id}`,
          { q: 'policy_id=' + id },
        );
        await this.loadScaPolicy((policy?.data?.data?.items || [])[0]);
        await this.initialize();
        window.location.href = window.location.href.replace(
          new RegExp('redirectPolicy=' + '[^&]*'),
          '',
        );
      } else {
        // Attempts to retrieve data from local storage
        const storedPolicies = localStorage.getItem('scaPolicies');
        if (storedPolicies) {
          // If there is data in localstorage I use it and clean localstorage
          this.setState({ policies: JSON.parse(storedPolicies) });
          localStorage.removeItem('scaPolicies');
        } else {
          // If there is no data in localstorage , I load the data normally
          await this.initialize();
          if (this.state.policies.length > 0) {
            await this.loadScaPolicy(this.state.policies[0].policy_id);
          }
        }
      }
    } catch (error) {
      this.setState({ loading: false });

      const options = {
        context: `${Dashboard.name}.componentDidMount`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
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
      if (!!this.props.currentAgentData?.id) {
        const {
          data: {
            data: { affected_items: policies },
          },
        } = await WzRequest.apiReq(
          'GET',
          `/sca/${this.props.currentAgentData.id}`,
          {},
        );
        policies.sort((a, b) => a.policy_id.localeCompare(b.policy_id)),
          this._isMount && this.setState({ loading: false, policies });
      }
    } catch (error) {
      this.setState({ loading: false, policies: [], lookingPolicy: false });

      const options = {
        context: `${Dashboard.name}.initialize`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  async loadScaPolicy(policy, secondTable) {
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
        const options = {
          context: `${Dashboard.name}.loadScaPolicy`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
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
    }

    const { status, os } = this.props.currentAgentData || {};
    const { loading, checksIsLoading, policies, lookingPolicy } = this.state;

    return (
      <Fragment>
        <div>
          {(loading || checksIsLoading) && (
            <div style={{ margin: 16 }}>
              <EuiSpacer size='m' />
              <EuiProgress size='xs' color='primary' />
            </div>
          )}
        </div>
        <EuiPage>
          {status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED &&
            !policies.length &&
            !loading && (
              <EuiCallOut title='No scans available' iconType='iInCircle'>
                <EuiButton color='primary' onClick={this.initialize}>
                  Refresh
                </EuiButton>
              </EuiCallOut>
            )}

          {status === API_NAME_AGENT_STATUS.NEVER_CONNECTED && !loading && (
            <EuiCallOut
              title='Agent has never connected'
              style={{ width: '100%' }}
              iconType='iInCircle'
            >
              <EuiButton color='primary' onClick={this.initialize}>
                Refresh
              </EuiButton>
            </EuiCallOut>
          )}

          {os &&
            policies.length > 0 &&
            !loading &&
            !checksIsLoading &&
            lookingPolicy && (
              <div className='sca-module-wrapper-donut'>
                {policies.length && (
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
                        betaBadgeLabel={lookingPolicy.name}
                        className='sca-module-card-visualization'
                      >
                        <VisualizationBasic
                          type='donut'
                          size={{ width: '100%', height: '150px' }}
                          data={
                            lookingPolicy
                              ? [
                                  {
                                    label: MODULE_SCA_CHECK_RESULT_LABEL.passed,
                                    value: lookingPolicy.pass,
                                    color: '#00a69b',
                                  },
                                  {
                                    label: MODULE_SCA_CHECK_RESULT_LABEL.failed,
                                    value: lookingPolicy.fail,
                                    color: '#ff645c',
                                  },
                                  {
                                    label:
                                      MODULE_SCA_CHECK_RESULT_LABEL[
                                        'not applicable'
                                      ],
                                    value: lookingPolicy.invalid,
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

                    <EuiFlexItem style={{ marginBottom: 0 }}>
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

          {os && lookingPolicy && (!loading || !checksIsLoading) && (
            <div style={{ marginTop: '12px' }}>
              <EuiPanel paddingSize='l'>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiTitle size='s'>
                      <h2>
                        {lookingPolicy.name}&nbsp;
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
                                {lookingPolicy.description}
                                <br></br>
                                <b>Policy checksum:</b>{' '}
                                {lookingPolicy.hash_file}
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
                        lookingPolicy.pass,
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
                        lookingPolicy.fail,
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
                        lookingPolicy.invalid,
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
                      title={`${lookingPolicy.score}%`}
                      description='Score'
                      titleColor='accent'
                      titleSize='m'
                      textAlign='center'
                    />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiStat
                      title={formatUIDate(lookingPolicy.end_scan)}
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
                      lookingPolicy={lookingPolicy}
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

const mapStateToProps = state => ({
  currentAgentData: state.appStateReducers.currentAgentData,
});

export default connect(mapStateToProps)(Dashboard);

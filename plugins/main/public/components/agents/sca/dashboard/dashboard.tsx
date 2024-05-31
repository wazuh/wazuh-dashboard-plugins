import React, { useState, useEffect } from 'react';
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

const Dashboard = ({ currentAgentData }) => {
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checksIsLoading, setChecksIsLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [lookingPolicy, setLookingPolicy] = useState(null);

  const columnsPolicies = [
    {
      field: 'name',
      name: 'Policy',
      sortable: true,
    },
  ];
  const updateGraphs = policy => {
    setLookingPolicy(policy);
  };
  const buttonStat = (text, field, value) => {
    const handleButtonClick = () => {
      setFilters({ q: `${field}=${value}` });
    };

    return <button onClick={handleButtonClick}>{text}</button>;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!!currentAgentData?.id) {
        const {
          data: {
            data: { affected_items: fetchedPolicies },
          },
        } = await WzRequest.apiReq('GET', `/sca/${currentAgentData.id}`, {});

        fetchedPolicies.sort((a, b) => a.policy_id.localeCompare(b.policy_id));
        if (fetchedPolicies.length > 0) {
          await loadScaPolicy(fetchedPolicies[0].policy_id, false);
        }
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedPolicies =
      JSON.parse(localStorage.getItem('scaPolicies')) || [];
    const lastStoredPolicy = storedPolicies[storedPolicies.length - 1];
    setLookingPolicy(lastStoredPolicy);

    if (lastStoredPolicy === undefined) {
      fetchData();
    }

    return () => {
      localStorage.removeItem('scaPolicies');
    };
  }, [currentAgentData]);

  const handleApiError = error => {
    setLoading(false);
    setLookingPolicy(null);
    const options = {
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      error: {
        error: error,
        message: error.message || error,
        title: error.name,
      },
    };
    getErrorOrchestrator().handleError(options);
  };

  const loadScaPolicy = async policyId => {
    try {
      setLookingPolicy(null);
      setChecksIsLoading(true);
      const policyResponse = await WzRequest.apiReq(
        'GET',
        `/sca/${currentAgentData.id}`,
        {
          params: {
            q: 'policy_id=' + policyId,
          },
        },
      );
      const [policyData] = policyResponse.data.data.affected_items;
      setLookingPolicy(policyData);
      setChecksIsLoading(false);
    } catch (error) {
      setLookingPolicy(policyId);
      setChecksIsLoading(false);
      handleApiError(error);
    }
  };

  const buttonPopover = (
    <EuiButtonEmpty
      iconType='iInCircle'
      aria-label='Help'
      onClick={() => setShowMoreInfo(!showMoreInfo)}
    />
  );

  if (currentAgentData.id === undefined) {
    return <div>Loading...</div>;
  }

  const { status, os } = currentAgentData || {};

  return (
    <div>
      {(loading || checksIsLoading) && (
        <div style={{ margin: 16 }}>
          <EuiSpacer size='m' />
          <EuiProgress size='xs' color='primary' />
        </div>
      )}
      <EuiPage>
        {status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED &&
          !lookingPolicy &&
          !loading && (
            <EuiCallOut title='No scans available' iconType='iInCircle'>
              <EuiButton color='primary' onClick={fetchData}>
                Refresh'
              </EuiButton>
            </EuiCallOut>
          )}
        {lookingPolicy && (
          <div className='sca-module-wrapper-donut'>
            {
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
                      agent={currentAgentData}
                      columns={columnsPolicies}
                      rowProps={updateGraphs}
                    />
                  </EuiPanel>
                </EuiFlexItem>
              </EuiFlexGroup>
            }
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
                          isOpen={showMoreInfo}
                          closePopover={() => setShowMoreInfo(false)}
                        >
                          <EuiFlexItem style={{ width: 700 }}>
                            <EuiSpacer size='s' />
                            <EuiText>
                              <b>Policy description:</b>{' '}
                              {lookingPolicy.description}
                              <br></br>
                              <b>Policy checksum:</b> {lookingPolicy.hash_file}
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
                    title={buttonStat(lookingPolicy.pass, 'result', 'passed')}
                    description={MODULE_SCA_CHECK_RESULT_LABEL.passed}
                    titleColor='secondary'
                    titleSize='m'
                    textAlign='center'
                  />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiStat
                    title={buttonStat(lookingPolicy.fail, 'result', 'failed')}
                    description={MODULE_SCA_CHECK_RESULT_LABEL.failed}
                    titleColor='danger'
                    titleSize='m'
                    textAlign='center'
                  />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiStat
                    title={buttonStat(
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
                    agent={currentAgentData}
                    filters={filters}
                    lookingPolicy={lookingPolicy}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </div>
        )}
      </EuiPage>
    </div>
  );
};

const mapStateToProps = state => ({
  currentAgentData: state.appStateReducers.currentAgentData,
});

export default connect(mapStateToProps)(Dashboard);

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
  EuiLoadingChart,
  EuiButtonIcon,
  EuiToolTip,
  EuiEmptyPrompt,
  EuiBasicTable,
} from '@elastic/eui';
import { getCore, getPlugins } from '../../../../../kibana-services';
import { withUserAuthorizationPrompt } from '../../../hocs';
import { compose } from 'redux';
import { MODULE_SCA_CHECK_RESULT_LABEL } from '../../../../../../common/constants';
import { configurationAssessment } from '../../../../../utils/applications';
import { RedirectAppLinks } from '../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { PinnedAgentManager } from '../../../../wz-agent-selector/wz-agent-selector-service';
import NavigationService from '../../../../../react-services/navigation-service';
import { search } from '../../../search-bar';

type Props = {
  agent: { [key in string]: any };
};

export const ScaScan = compose(
  withUserAuthorizationPrompt([
    [
      { action: 'agent:read', resource: 'agent:id:*' },
      { action: 'agent:read', resource: 'agent:group:*' },
    ],
    [
      { action: 'sca:read', resource: 'agent:id:*' },
      { action: 'sca:read', resource: 'agent:group:*' },
    ],
  ]),
)(
  class ScaScan extends Component<Props> {
    _isMount = false;
    state: {
      isLoading: Boolean;
      policies: any[];
      pageIndex: 0;
      pageSize: 5;
    };

    pinnedAgentManager: PinnedAgentManager;

    constructor(props) {
      super(props);
      this.pinnedAgentManager = new PinnedAgentManager();
      this.state = {
        isLoading: true,
        policies: [],
        pageIndex: 0,
        pageSize: 5,
      };
    }

    async componentDidMount() {
      this._isMount = true;
      this.getLastPolicies(this.props.agent.id);
    }

    async componentDidUpdate(prevProps: Readonly<Props>) {
      if (prevProps.agent.id !== this.props.agent.id) {
        this.getLastPolicies(this.props.agent.id);
      }
    }

    async getLastPolicies(agentId: string) {
      try {
        const indexPattern = await getPlugins().data.indexPatterns.get(
          'wazuh-states-sca-*',
        );

        const response = await search({
          indexPattern,
          filters: [
            {
              meta: {
                key: 'agent.id',
                type: 'phrase',
                value: agentId,
                disabled: false,
                negate: false,
                alias: null,
              },
              query: {
                match_phrase: {
                  'agent.id': agentId,
                },
              },
            },
          ],
          fields: ['policy.name', 'check.result', 'policy.id'],
          pagination: {
            pageIndex: 0,
            pageSize: 1000,
          },
        });

        const hits = response?.hits?.hits || [];

        const grouped = hits.reduce((acc, hit) => {
          const { policy, check } = hit._source;

          if (!policy?.name) return acc;

          const key = policy.name;
          acc[key] = acc[key] || {
            name: policy.name,
            policy_id: policy.id,
            pass: 0,
            fail: 0,
            not_run: 0,
            total: 0,
          };

          const result = (check?.result || '').toLowerCase();

          if (['passed', 'failed', 'not run'].includes(result)) {
            if (result === 'passed') acc[key].pass++;
            if (result === 'failed') acc[key].fail++;
            if (result === 'not run') acc[key].not_run++;
          }

          acc[key].total++;

          return acc;
        }, {});

        const policies = Object.values(grouped);

        if (this._isMount) {
          this.setState({ policies, isLoading: false });
        }
      } catch (error) {
        console.error('Failed to get policies:', error);
        if (this._isMount) {
          this.setState({
            isLoading: false,
          });
        }
      }
    }

    onTableChange = ({ page }: any) => {
      this.setState({
        pageIndex: page.index,
        pageSize: page.size,
      });
    };

    renderLoadingStatus() {
      const { isLoading } = this.state;
      if (!isLoading) {
        return;
      } else {
        return (
          <EuiFlexGroup justifyContent='center' alignItems='center'>
            <EuiFlexItem grow={false}>
              <div
                style={{
                  display: 'block',
                  textAlign: 'center',
                  paddingTop: 100,
                }}
              >
                <EuiLoadingChart size='xl' />
              </div>
            </EuiFlexItem>
          </EuiFlexGroup>
        );
      }
    }

    renderScanDetails() {
      const { isLoading, policies, pageIndex, pageSize } = this.state;
      if (isLoading || !policies.length) return;

      const pageOfItems = policies.slice(
        pageIndex * pageSize,
        pageIndex * pageSize + pageSize,
      );

      const columnsPolicies = [
        {
          field: 'name',
          name: 'Policy',
          width: '40%',
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
          field: 'not_run',
          name: MODULE_SCA_CHECK_RESULT_LABEL['not run'],
          width: '10%',
        },
        {
          field: 'total',
          name: 'Total Checks',
          width: '10%',
        },
      ];

      return (
        <Fragment>
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiTitle size='xs'>
                <h4>Checks by policies</h4>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiPanel style={{ marginTop: 16 }}>
            <EuiBasicTable
              items={pageOfItems}
              columns={columnsPolicies}
              pagination={{
                showPerPageOptions: false,
                pageIndex,
                pageSize,
                totalItemCount: policies.length,
                hidePerPageOptions: true,
              }}
              onChange={this.onTableChange}
              rowProps={(item, idx) => ({
                'data-test-subj': `sca-row-${idx}`,
                className: 'customRowClass',
              })}
            />
          </EuiPanel>
        </Fragment>
      );
    }

    renderEmptyPrompt() {
      const { isLoading } = this.state;
      if (isLoading) return;
      return (
        <Fragment>
          <EuiEmptyPrompt
            iconType='visVega'
            title={<h4>You don't have SCA scans in this agent.</h4>}
            body={
              <Fragment>
                <p>Check your agent settings to generate scans.</p>
              </Fragment>
            }
          />
        </Fragment>
      );
    }

    render() {
      const { policies } = this.state;
      const loading = this.renderLoadingStatus();
      const scaScan = this.renderScanDetails();
      const emptyPrompt = this.renderEmptyPrompt();
      if (loading) {
        return (
          <EuiFlexItem>
            <EuiPanel paddingSize='m'>{loading}</EuiPanel>
          </EuiFlexItem>
        );
      }
      if (!policies.length) {
        return (
          <EuiFlexItem>
            <EuiPanel paddingSize='m'>{emptyPrompt}</EuiPanel>
          </EuiFlexItem>
        );
      }
      return (
        <EuiFlexItem>
          <EuiPanel paddingSize='m'>
            <EuiText size='xs'>
              <EuiFlexGroup className='wz-section-sca-euiFlexGroup'>
                <EuiFlexItem grow={false}>
                  <RedirectAppLinks application={getCore().application}>
                    <EuiTitle size='xs'>
                      <h2>SCA: Scans summary</h2>
                    </EuiTitle>
                  </RedirectAppLinks>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <RedirectAppLinks application={getCore().application}>
                    <EuiToolTip position='top' content='Open SCA Scans'>
                      <EuiButtonIcon
                        iconType='popout'
                        color='primary'
                        className='EuiButtonIcon'
                        onClick={() => {
                          this.pinnedAgentManager.pinAgent(this.props.agent);
                        }}
                        href={NavigationService.getInstance().getUrlForApp(
                          configurationAssessment.id,
                        )}
                        aria-label='Open SCA Scans'
                      />
                    </EuiToolTip>
                  </RedirectAppLinks>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiText>
            {scaScan}
          </EuiPanel>
        </EuiFlexItem>
      );
    }
  },
);

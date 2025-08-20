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

import React from 'react';
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
  EuiInMemoryTable,
} from '@elastic/eui';
import { getCore } from '../../../../../kibana-services';
import { withDataSourceFetch, withGuard, withPanel } from '../../../hocs';
import { compose } from 'redux';
import { MODULE_SCA_CHECK_RESULT_LABEL } from '../../../../../../common/constants';
import { configurationAssessment } from '../../../../../utils/applications';
import { RedirectAppLinks } from '../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { PinnedAgentManager } from '../../../../wz-agent-selector/wz-agent-selector-service';
import NavigationService from '../../../../../react-services/navigation-service';
import {
  SCAStatesDataSource,
  SCAStatesDataSourceRepository,
} from '../../../data-source/pattern/sca';
import { LoadingSearchbarProgress } from '../../../loading-searchbar-progress/loading-searchbar-progress';
import { CheckResult } from '../../../../overview/sca/utils/constants';
import { groupBy } from 'lodash';

type ScaScanProps = {
  agent: { [key in string]: any };
};

const TOP_POLICIES_SIZE = 20;

const ScaScanHeader = ({ agent }) => {
  return (
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
                  new PinnedAgentManager().pinAgent(agent);
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
  );
};

const ScaScanFetchingData = () => (
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

const ScaScanTable = ({ dataSourceAction }) => {
  const { hits: policies = [] } = dataSourceAction.data || {};

  const columnsPolicies = [
    {
      field: 'name',
      name: 'Policy',
      width: '40%',
      sortable: true,
    },
    {
      field: 'pass',
      name: MODULE_SCA_CHECK_RESULT_LABEL.PASSED.value,
      width: '10%',
      sortable: true,
    },
    {
      field: 'fail',
      name: MODULE_SCA_CHECK_RESULT_LABEL.FAILED.value,
      width: '10%',
      sortable: true,
    },
    {
      field: 'not_run',
      name: MODULE_SCA_CHECK_RESULT_LABEL.NOT_RUN.value,
      width: '10%',
      sortable: true,
    },
    {
      field: 'total',
      name: 'Total Checks',
      width: '10%',
      sortable: true,
    },
  ];

  return (
    <>
      <EuiFlexGroup alignItems='center' gutterSize='s'>
        <EuiFlexItem grow={false} responsive={false}>
          <EuiTitle size='xs'>
            <h4>Checks by policies</h4>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false} responsive={false}>
          <EuiText size='xs'>
            <span>(top {TOP_POLICIES_SIZE})</span>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiPanel style={{ marginTop: 16 }}>
        <EuiInMemoryTable
          columns={columnsPolicies}
          items={policies}
          loading={dataSourceAction.isLoading}
          sorting={true}
          pagination={{
            hidePerPageOptions: true,
            pageSize: 5,
          }}
          cellProps={(item, column) => {
            if (column.field == 'name') {
              return {
                title: `${item.name} (${item.id})`,
              };
            }
          }}
        />
      </EuiPanel>
    </>
  );
};

const ScaScanNoData = () => {
  return (
    <>
      <EuiEmptyPrompt
        iconType='visVega'
        title={<h4>You don't have SCA scans in this agent.</h4>}
        body={
          <>
            <p>Check your agent settings to generate scans.</p>
          </>
        }
      />
    </>
  );
};

const ScaScanBody = compose(
  withDataSourceFetch({
    DataSource: SCAStatesDataSource,
    DataSourceRepositoryCreator: SCAStatesDataSourceRepository,
    LoadingDataSourceComponent: LoadingSearchbarProgress,
    mapRequestParams() {
      return {
        aggs: {
          policy_id: {
            terms: {
              field: 'policy.id',
              size: TOP_POLICIES_SIZE,
            },
            aggs: {
              policy_name: {
                terms: {
                  field: 'policy.name',
                  size: 1,
                },
                aggs: {
                  check_result: {
                    terms: {
                      field: 'check.result',
                      size: 5,
                    },
                  },
                },
              },
            },
          },
        },
      };
    },
    mapResponse(response) {
      return {
        hits: response.aggregations?.policy_id.buckets.map(
          ({ key, policy_name: policyNameBuckets }) => {
            const [{ key: policy_name, check_result }] =
              policyNameBuckets.buckets;
            console.log({ policyNameBuckets, policy_name, check_result });
            const {
              [CheckResult.Passed]: [{ doc_count: pass }] = [{ doc_count: 0 }],
              [CheckResult.Failed]: [{ doc_count: fail }] = [{ doc_count: 0 }],
              [CheckResult.NotRun]: [{ doc_count: not_run }] = [
                { doc_count: 0 },
              ],
            } = groupBy(check_result.buckets, 'key');

            const total = pass + fail + not_run;
            return {
              id: key,
              name: policy_name,
              pass,
              fail,
              not_run,
              total,
            };
          },
        ),
      };
    },
    mapFetchActionDependencies(props) {
      return [props.agent, props.pageIndex, props.pageSize];
    },
    FetchingDataComponent: ScaScanFetchingData,
  }),
  withGuard(({ dataSourceAction }) => {
    return dataSourceAction.data?.hits?.length === 0;
  }, ScaScanNoData),
)(ScaScanTable);

export const ScaScan: React.FC<Props> = withPanel({ paddingSize: 'm' })(
  (props: Props) => {
    return (
      <>
        <ScaScanHeader agent={props.agent} />
        <ScaScanBody agent={props.agent}></ScaScanBody>
      </>
    );
  },
);

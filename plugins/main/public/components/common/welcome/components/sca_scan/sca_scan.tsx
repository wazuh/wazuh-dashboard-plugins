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
  EuiLoadingChart,
  EuiButtonIcon,
  EuiToolTip,
  EuiEmptyPrompt,
  EuiInMemoryTable,
} from '@elastic/eui';
import { Typography, TypographySize } from '../../../typography/typography';
import { getCore } from '../../../../../kibana-services';
import { withDataSourceFetch, withGuard, withPanel } from '../../../hocs';
import { compose } from 'redux';
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
import { decimalFormat } from '../../../../overview/sca/components/dashboard/utils/visualization-helpers';
import d3 from 'd3';

type ScaScanProps = {
  agent: { [key in string]: any };
};

const TOP_POLICIES_SIZE = 20;

const ScaScanHeader = ({ agent }) => {
  return (
    <EuiFlexGroup className='wz-section-sca-euiFlexGroup'>
      <EuiFlexItem grow={false}>
        <RedirectAppLinks application={getCore().application}>
          <Typography level='card'>
            Security Configuration Assessment
          </Typography>
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
      name: CheckResult.Passed,
      width: '10%',
      sortable: true,
    },
    {
      field: 'fail',
      name: CheckResult.Failed,
      width: '10%',
      sortable: true,
    },
    {
      field: 'score',
      name: 'Score',
      width: '10%',
      sortable: true,
      render: score => {
        const scoreFormat = decimalFormat();
        return `${d3.format(scoreFormat)(score * 100)}%`;
      },
    },
  ];

  return (
    <>
      <EuiFlexGroup alignItems='center' gutterSize='s'>
        <EuiFlexItem grow={false} responsive={false}>
          <Typography level='metric'>Checks by policies</Typography>
        </EuiFlexItem>
        <EuiFlexItem grow={false} responsive={false}>
          <Typography level='metric'>(top {TOP_POLICIES_SIZE})</Typography>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiPanel style={{ marginTop: 16 }}>
        <EuiInMemoryTable
          columns={columnsPolicies}
          items={policies}
          loading={dataSourceAction.running}
          sorting={true}
          error={dataSourceAction.error}
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
        titleSize={TypographySize({ level: 'prompt' })}
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
            const {
              [CheckResult.Passed]: [{ doc_count: pass }] = [{ doc_count: 0 }],
              [CheckResult.Failed]: [{ doc_count: fail }] = [{ doc_count: 0 }],
            } = groupBy(check_result.buckets, 'key');

            const score = pass / Math.max(pass + fail, 1);
            return {
              id: key,
              name: policy_name,
              pass,
              fail,
              score,
            };
          },
        ),
      };
    },
    FetchingDataComponent: ScaScanFetchingData,
  }),
  withGuard(({ dataSourceAction }) => {
    return dataSourceAction.data?.hits?.length === 0;
  }, ScaScanNoData),
)(ScaScanTable);

export const ScaScan: React.FC<ScaScanProps> = withPanel({ paddingSize: 'm' })(
  (props: ScaScanProps) => {
    return (
      <>
        <ScaScanHeader agent={props.agent} />
        <ScaScanBody agent={props.agent}></ScaScanBody>
      </>
    );
  },
);

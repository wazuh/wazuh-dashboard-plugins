import React, { useCallback, useState } from 'react';
import { withErrorBoundary } from '../../../../common/hocs';

import {
  VulnerabilitiesDataSource,
  VulnerabilitiesDataSourceRepository,
} from '../../../../common/data-source';
import { withVulnerabilitiesStateDataSource } from '../../common/hocs/validate-vulnerabilities-states-index-pattern';
import { createDashboard } from '../../../../common/dashboards';
import {
  WAZUH_SAMPLE_VULNERABILITIES,
  VULNERABILITIES_DASHBOARD_ID,
  VULNERABILITIES_AGENT_DASHBOARD_ID,
  WAZUH_VULNERABILITIES_PATTERN,
} from '../../../../../../common/constants';
import VulsEvaluationFilter, {
  getUnderEvaluationFilterValue,
  createUnderEvaluationFilter,
  UNDER_EVALUATION_FIELD,
} from '../../common/components/vuls-evaluation-filter';

export const vulnerabilityManagedFilters = {
  underEvaluation: {
    managedField: UNDER_EVALUATION_FIELD,
    selector: f =>
      f.meta?.key === UNDER_EVALUATION_FIELD && f.meta?.type === 'phrase',
    component: (props: {
      managedFilter?: any;
      setManagedFilter: (filters: any[]) => void;
    }) => {
      const onChange = (underEvaluation: boolean | null) => {
        const newFilters = [];
        if (underEvaluation !== null) {
          const indexId = WAZUH_VULNERABILITIES_PATTERN;
          newFilters.push(
            createUnderEvaluationFilter(underEvaluation, indexId),
          );
        }
        props?.setManagedFilter(newFilters);
      };

      return (
        <VulsEvaluationFilter
          value={getUnderEvaluationFilterValue(props?.managedFilter)}
          setValue={onChange}
        />
      );
    },
    order: 1,
  },
};

export const DashboardVuls = withErrorBoundary(
  withVulnerabilitiesStateDataSource(
    createDashboard({
      DataSource: VulnerabilitiesDataSource,
      DataSourceRepositoryCreator: VulnerabilitiesDataSourceRepository,
      managedFilters: vulnerabilityManagedFilters,
      getDashboardPanels: [
        {
          dashboardId: VULNERABILITIES_DASHBOARD_ID,
          agentDashboardId: VULNERABILITIES_AGENT_DASHBOARD_ID,
        },
      ],
      sampleDataWarningCategories: [WAZUH_SAMPLE_VULNERABILITIES],
    }),
  ),
);

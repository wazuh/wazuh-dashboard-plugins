import React, { useCallback, useState } from 'react';
import { withErrorBoundary } from '../../../../common/hocs';

import {
  VulnerabilitiesDataSource,
  VulnerabilitiesDataSourceRepository,
} from '../../../../common/data-source';

import { withVulnerabilitiesStateDataSource } from '../../common/hocs/validate-vulnerabilities-states-index-pattern';
import { createDashboard } from '../../../../common/dashboards';
import { withCustomSearchBarFilters } from '../../../../common/search-bar';
import {
  WAZUH_SAMPLE_VULNERABILITIES,
  VULNERABILITIES_DASHBOARD_ID,
  VULNERABILITIES_AGENT_DASHBOARD_ID,
  WAZUH_VULNERABILITIES_PATTERN,
} from '../../../../../../common/constants';

import VulsEvaluationFilter, {
  getUnderEvaluationFilterValue,
  createUnderEvaluationFilter,
  excludeUnderEvaluationFilter
} from '../../common/components/vuls-evaluation-filter';

const withVulsCustomFilters = withCustomSearchBarFilters({
  getPostFixedFilters: ({ filters }) => {
    const getUnderEvaluation = useCallback(getUnderEvaluationFilterValue, []);

    const [underEvaluation, setUnderEvaluation] = useState<boolean | null>(getUnderEvaluation(filters || []));
    const [filterValue, setFilterValue] = useState([]);

    const onChange = (underEvaluation: boolean | null) => {
      const newFilters = excludeUnderEvaluationFilter(filters || []);
      if (underEvaluation !== null) {
        const indexId = WAZUH_VULNERABILITIES_PATTERN;
        newFilters.push(createUnderEvaluationFilter(underEvaluation, indexId));
      }
      setUnderEvaluation(underEvaluation);
      setFilterValue(newFilters as Filter[]);
    };

    return {
        postFixedFilters: () => (<VulsEvaluationFilter value={underEvaluation} setValue={onChange} />),
        postFixedFiltersValue: filterValue,
      }
  },
});

export const DashboardVuls = withErrorBoundary(
  withVulnerabilitiesStateDataSource(
    withVulsCustomFilters(
      createDashboard({
        DataSource: VulnerabilitiesDataSource,
        DataSourceRepositoryCreator: VulnerabilitiesDataSourceRepository,
        getDashboardPanels: [
          {
            //dashboardId: VULNERABILITIES_DASHBOARD_ID,
            dashboardId: "90d7493a-f7b5-4da4-9de4-85258f22f4d0",
            agentDashboardId: VULNERABILITIES_AGENT_DASHBOARD_ID,
          },
        ],
        sampleDataWarningCategories: [WAZUH_SAMPLE_VULNERABILITIES],
      }),
    ),
  ),
);
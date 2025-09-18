import React from 'react';
import _ from 'lodash';
import { WAZUH_SAMPLE_SECURITY_CONFIGURATION_ASSESSMENT } from '../../../../../../common/constants';
import {
  SCAStatesDataSource,
  SCAStatesDataSourceRepository,
} from '../../../../common/data-source/pattern/sca';
import { IndexPattern } from '../../../../../../../../src/plugins/data/public';
import { InventoryDashboardTable } from '../../../../common/dashboards';
import { CheckDetails } from '../sca-check-details';
import { getKPIsPanel } from './utils/get-vis-sca-inventory';
import { managedFilters, tableColumns } from './utils/index';
import { withSCADataSource } from '../../hocs/validate-sca-states-index-pattern';
import { withErrorBoundary } from '../../../../common/hocs';
import { compose } from 'redux';

/**
 * @fileoverview SCA Inventory component for Wazuh Dashboard
 *
 * This component displays the Security Configuration Assessment (SCA) inventory,
 * which shows the security policies and checks compliance status for Wazuh agents.
 * SCA is a module that provides continuous evaluation of security configurations
 * against established baselines, helping to identify misconfigurations and
 * compliance issues in the monitored systems.
 *
 * The inventory displays detailed information about:
 * - Policy compliance status (passed, failed, not applicable checks)
 * - Security benchmarks and standards being evaluated
 * - Configuration assessment results for each agent
 * - Detailed reports of policy checks and remediation suggestions
 *
 * This component is part of the Configuration Assessment module in Wazuh Dashboard and helps
 * security teams ensure systems are properly configured according to security
 * best practices and compliance requirements.
 */
export const SCAInventory: React.FC<{}> = compose(
  withErrorBoundary,
  withSCADataSource,
)(() => {
  return (
    <InventoryDashboardTable
      DataSource={SCAStatesDataSource}
      DataSourceRepositoryCreator={SCAStatesDataSourceRepository}
      tableDefaultColumns={tableColumns}
      managedFilters={managedFilters}
      getDashboardPanels={getKPIsPanel}
      tableId='sca-policies-inventory'
      categoriesSampleData={[WAZUH_SAMPLE_SECURITY_CONFIGURATION_ASSESSMENT]}
      additionalDocumentDetailsTabs={[
        {
          id: 'sca-dashboard-tab',
          title: 'Security Configuration Assessment dashboard',
          description: 'Dashboard of the Security Configuration Assessment',
          name: 'Check Details',
          // This is rendered in the document details view
          // It is a custom component that shows the details of the check of a policy
          content: props => <CheckDetails {...props} />,
        },
      ]}
    />
  );
});

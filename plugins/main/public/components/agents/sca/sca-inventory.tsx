import React from 'react';
import _ from 'lodash';
import { WAZUH_SAMPLE_SCA } from '../../../../common/constants';
import {
  SCAStatesDataSource,
  SCAStatesDataSourceRepository,
} from '../../common/data-source/pattern/sca';
import { InventoryDashboardTable } from '../../common/dashboards';
import { withAgent } from '../../overview/fim/inventory/inventories/hocs';
import { compose } from 'redux';
import { withSCADataSource } from './hocs/validate-sca-states-index-pattern';
import { buildDashboardKPIPanels } from '../../overview/it-hygiene/common/create-dashboard-panels-kpis';
import tableColumns from './table-columns-sca';
import { SCAInventoryProps } from './interfaces/interface-sca';

/**
 * @fileoverview SCA Inventory component for Wazuh Dashboard
 *
 * This component displays the Security Configuration Assessment (SCA) inventory,
 * which shows the security policies compliance status for Wazuh agents.
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
export const SCAInventory = compose(
  withAgent,
  withSCADataSource,
)((props: SCAInventoryProps) => {
  return (
    <div style={{ margin: '0 12px' }}>
      <InventoryDashboardTable
        DataSource={SCAStatesDataSource}
        DataSourceRepositoryCreator={SCAStatesDataSourceRepository}
        tableDefaultColumns={tableColumns}
        managedFilters={[]}
        getDashboardPanels={() => buildDashboardKPIPanels([])}
        tableId='sca-policies-inventory'
        indexPattern={props.indexPattern}
        categoriesSampleData={[WAZUH_SAMPLE_SCA]}
      />
    </div>
  );
});

import React from 'react';
import { DashboardTSC } from './dashboards/dashboard';
import { TSCDataSource } from '../../../common/data-source';
import { tscColumns } from './events/tsc-columns';
import { ComplianceModule } from '../shared/compliance-module';

import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';
import { WAZUH_MODULES_ID } from '../../../../../common/constants';

const moduleId = WAZUH_MODULES_ID.TSC;
export const RegulatoryComplianceTSC = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardTSC,
    section: moduleId,
    moduleId: moduleId,
    dataSource: TSCDataSource,
    tableColumns: tscColumns,
  });

  return <ComplianceModule moduleId={moduleId} tabs={tabs} />;
};

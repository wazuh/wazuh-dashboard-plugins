import React from 'react';
import { DashboardTSC } from './dashboards/dashboard';
import { TSCDataSource } from '../../../common/data-source';
import { tscColumns } from './events/tsc-columns';
import { ComplianceModule } from '../shared/compliance-module';

import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';

export const RegulatoryComplianceTSC = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardTSC,
    section: 'tsc',
    moduleId: 'tsc',
    dataSource: TSCDataSource,
    tableColumns: tscColumns,
  });

  return <ComplianceModule moduleId='tsc' tabs={tabs} />;
};

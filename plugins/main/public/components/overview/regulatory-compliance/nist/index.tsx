import React from 'react';
import { DashboardNIST80053 } from './dashboards/dashboard';
import { NIST80053DataSource } from '../../../common/data-source';
import { nistColumns } from './events/nist-columns';
import { ComplianceModule } from '../shared/compliance-module';

import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';

export const RegulatoryComplianceNIST80053 = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardNIST80053,
    section: 'nist',
    moduleId: 'nist',
    dataSource: NIST80053DataSource,
    tableColumns: nistColumns,
  });

  return <ComplianceModule moduleId='nist' tabs={tabs} />;
};

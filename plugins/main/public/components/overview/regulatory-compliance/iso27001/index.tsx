import React from 'react';
import { DashboardISO27001 } from './dashboards/dashboard';
import { ISO27001DataSource } from '../../../common/data-source/pattern/events/iso-27001';
import { iso27001Columns as tableColumns } from './events/iso-27001-columns';
import { ComplianceModule } from '../shared/compliance-module';

import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';

export const RegulatoryComplianceISO27001 = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardISO27001,
    section: 'iso27001',
    moduleId: 'iso-27001',
    dataSource: ISO27001DataSource,
    tableColumns: tableColumns,
  });

  return <ComplianceModule moduleId='iso-27001' tabs={tabs} />;
};

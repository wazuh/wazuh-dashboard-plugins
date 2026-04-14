import React from 'react';
import { DashboardHIPAA } from './dashboards/dashboard';
import { HIPAADataSource } from '../../../common/data-source';
import { hipaaColumns } from './events/hipaa-columns';
import { ComplianceModule } from '../shared/compliance-module';

import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';

export const RegulatoryComplianceHIPAA = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardHIPAA,
    section: 'hipaa',
    moduleId: 'hipaa',
    dataSource: HIPAADataSource,
    tableColumns: hipaaColumns,
  });

  return <ComplianceModule moduleId='hipaa' tabs={tabs} />;
};

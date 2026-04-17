import React from 'react';
import { DashboardNIST800171 } from './dashboards/dashboard';
import { NIST800171DataSource } from '../../../common/data-source';
import { nist171Columns } from './events/nist-171-columns';
import { ComplianceModule } from '../shared/compliance-module';
import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';

export const RegulatoryComplianceNIST800171 = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardNIST800171,
    section: 'nist-800-171',
    moduleId: 'nist-800-171',
    dataSource: NIST800171DataSource,
    tableColumns: nist171Columns,
  });

  return <ComplianceModule moduleId='nist-800-171' tabs={tabs} />;
};

import React from 'react';
import { DashboardNIST800171 } from './dashboards/dashboard';
import { NIST800171DataSource } from '../../../common/data-source';
import { nist171Columns } from './events/nist-171-columns';
import { ComplianceModule } from '../shared/compliance-module';
import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';
import { WAZUH_MODULES_ID } from '../../../../../common/constants';

const moduleId = WAZUH_MODULES_ID.NIST_800_171;
export const RegulatoryComplianceNIST800171 = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardNIST800171,
    section: moduleId,
    moduleId: moduleId,
    dataSource: NIST800171DataSource,
    tableColumns: nist171Columns,
  });

  return <ComplianceModule moduleId={moduleId} tabs={tabs} />;
};

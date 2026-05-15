import React from 'react';
import { DashboardNIST800171 } from './dashboards/dashboard';
import { NIST800171DataSource } from '../../../common/data-source';
import { createRegulatoryComplianceColumns } from '../shared/create-regulatory-compliance-columns';
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
    tableColumns: createRegulatoryComplianceColumns(
      'wazuh.rule.compliance.nist_800_171',
      300,
    ),
  });

  return <ComplianceModule moduleId={moduleId} tabs={tabs} />;
};

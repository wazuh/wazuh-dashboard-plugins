import React from 'react';
import { DashboardNIST80053 } from './dashboards/dashboard';
import { NIST80053DataSource } from '../../../common/data-source';
import { createRegulatoryComplianceColumns } from '../shared/create-regulatory-compliance-columns';
import { ComplianceModule } from '../shared/compliance-module';

import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';
import { WAZUH_MODULES_ID } from '../../../../../common/constants';

const moduleId = WAZUH_MODULES_ID.NIST_800_53;
export const RegulatoryComplianceNIST80053 = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardNIST80053,
    section: moduleId,
    moduleId: moduleId,
    dataSource: NIST80053DataSource,
    tableColumns: createRegulatoryComplianceColumns(
      'wazuh.rule.compliance.nist_800_53',
      300,
    ),
  });

  return <ComplianceModule moduleId={moduleId} tabs={tabs} />;
};

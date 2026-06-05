import React from 'react';
import { DashboardPCIDSS } from './dashboards/dashboard';
import { PCIDSSDataSource } from '../../../common/data-source';
import { createRegulatoryComplianceColumns } from '../shared/create-regulatory-compliance-columns';
import { ComplianceModule } from '../shared/compliance-module';

import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';
import { WAZUH_MODULES_ID } from '../../../../../common/constants';

const moduleId = WAZUH_MODULES_ID.PCI_DSS;
export const RegulatoryCompliancePCIDSS = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardPCIDSS,
    section: moduleId,
    moduleId: moduleId,
    dataSource: PCIDSSDataSource,
    tableColumns: createRegulatoryComplianceColumns(
      'wazuh.rule.compliance.pci_dss',
      300,
    ),
  });

  return <ComplianceModule moduleId={moduleId} tabs={tabs} />;
};

import React from 'react';
import { DashboardPCIDSS } from './dashboards/dashboard';
import { PCIDSSDataSource } from '../../../common/data-source';
import { pciColumns } from './events/pci-columns';
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
    tableColumns: pciColumns,
  });

  return <ComplianceModule moduleId={moduleId} tabs={tabs} />;
};

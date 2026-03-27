import React from 'react';
import { DashboardPCIDSS } from './dashboards/dashboard';
import { PCIDSSDataSource } from '../../../common/data-source';
import { pciColumns } from './events/pci-columns';
import { ComplianceModule } from '../shared/compliance-module';

import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';

export const RegulatoryCompliancePCIDSS = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardPCIDSS,
    section: 'pci',
    moduleId: 'pci',
    dataSource: PCIDSSDataSource,
    tableColumns: pciColumns,
  });

  return <ComplianceModule moduleId='pci' tabs={tabs} />;
};

import React from 'react';
import { DashboardFEDRAMP } from './dashboards';
import { FEDRAMPDataSource } from '../../../common/data-source';
import { fedrampColumns } from './events/fedramp-columns';
import { ComplianceModule } from '../shared/compliance-module';

import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';

export const RegulatoryComplianceFEDRAMP = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardFEDRAMP,
    section: 'fedramp',
    moduleId: 'fedramp',
    dataSource: FEDRAMPDataSource,
    tableColumns: fedrampColumns,
  });

  return <ComplianceModule moduleId='fedramp' tabs={tabs} />;
};

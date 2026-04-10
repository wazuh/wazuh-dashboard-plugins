import React from 'react';
import { DashboardFedRAMP } from './dashboards';
import { FedRAMPDataSource } from '../../../common/data-source';
import { fedrampColumns } from './events/fedramp-columns';
import { ComplianceModule } from '../shared/compliance-module';

import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';

export const RegulatoryComplianceFedRAMP = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardFedRAMP,
    section: 'fedramp',
    moduleId: 'fedramp',
    dataSource: FedRAMPDataSource,
    tableColumns: fedrampColumns,
  });

  return <ComplianceModule moduleId='fedramp' tabs={tabs} />;
};

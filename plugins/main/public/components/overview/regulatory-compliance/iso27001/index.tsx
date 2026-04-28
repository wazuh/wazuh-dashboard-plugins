import React from 'react';
import { DashboardISO27001 } from './dashboards/dashboard';
import { ISO27001DataSource } from '../../../common/data-source/pattern/events/iso-27001';
import { iso27001Columns as tableColumns } from './events/iso-27001-columns';
import { ComplianceModule } from '../shared/compliance-module';

import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';
import { WAZUH_MODULES_ID } from '../../../../../common/constants';

const moduleId = WAZUH_MODULES_ID.ISO_27001;
export const RegulatoryComplianceISO27001 = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardISO27001,
    section: moduleId,
    moduleId: moduleId,
    dataSource: ISO27001DataSource,
    tableColumns: tableColumns,
  });

  return <ComplianceModule moduleId={moduleId} tabs={tabs} />;
};

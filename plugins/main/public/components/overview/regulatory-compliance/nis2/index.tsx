import React from 'react';
import { DashboardNIS2 } from './dashboards/dashboard';
import { Nis2DataSource } from '../../../common/data-source';
import { nis2Columns } from './events/nis2-columns';
import { ComplianceModule } from '../shared/compliance-module';
import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';
import { WAZUH_MODULES_ID } from '../../../../../common/constants';

const moduleId = WAZUH_MODULES_ID.NIS2;
export const RegulatoryComplianceNIS2 = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardNIS2,
    section: moduleId,
    moduleId: moduleId,
    dataSource: Nis2DataSource,
    tableColumns: nis2Columns,
  });

  return <ComplianceModule moduleId={moduleId} tabs={tabs} />;
};

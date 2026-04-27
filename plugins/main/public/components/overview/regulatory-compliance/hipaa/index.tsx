import React from 'react';
import { DashboardHIPAA } from './dashboards/dashboard';
import { HIPAADataSource } from '../../../common/data-source';
import { hipaaColumns } from './events/hipaa-columns';
import { ComplianceModule } from '../shared/compliance-module';
import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';
import { WAZUH_MODULES_ID } from '../../../../../common/constants';

const moduleId = WAZUH_MODULES_ID.HIPAA;
export const RegulatoryComplianceHIPAA = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardHIPAA,
    section: moduleId,
    moduleId: moduleId,
    dataSource: HIPAADataSource,
    tableColumns: hipaaColumns,
  });

  return <ComplianceModule moduleId={moduleId} tabs={tabs} />;
};

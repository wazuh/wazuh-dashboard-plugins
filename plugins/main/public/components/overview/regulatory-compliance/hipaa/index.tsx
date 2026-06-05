import React from 'react';
import { DashboardHIPAA } from './dashboards/dashboard';
import { HIPAADataSource } from '../../../common/data-source';
import { createRegulatoryComplianceColumns } from '../shared/create-regulatory-compliance-columns';
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
    tableColumns: createRegulatoryComplianceColumns(
      'wazuh.rule.compliance.hipaa',
    ),
  });

  return <ComplianceModule moduleId={moduleId} tabs={tabs} />;
};

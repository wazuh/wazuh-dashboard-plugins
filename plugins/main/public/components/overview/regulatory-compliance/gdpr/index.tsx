import React from 'react';
import { DashboardGDPR } from './dashboards/dashboard';
import { GDPRDataSource } from '../../../common/data-source';
import { createRegulatoryComplianceColumns } from '../shared/create-regulatory-compliance-columns';
import { ComplianceModule } from '../shared/compliance-module';
import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';
import { WAZUH_MODULES_ID } from '../../../../../common/constants';

const moduleId = WAZUH_MODULES_ID.GDPR;
export const RegulatoryComplianceGDPR = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardGDPR,
    section: moduleId,
    moduleId: moduleId,
    dataSource: GDPRDataSource,
    tableColumns: createRegulatoryComplianceColumns(
      'wazuh.rule.compliance.gdpr',
    ),
  });

  return <ComplianceModule moduleId={moduleId} tabs={tabs} />;
};

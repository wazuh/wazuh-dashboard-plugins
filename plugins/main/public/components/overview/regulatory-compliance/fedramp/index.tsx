import React from 'react';
import { DashboardFedRAMP } from './dashboards';
import { FedRAMPDataSource } from '../../../common/data-source';
import { createRegulatoryComplianceColumns } from '../shared/create-regulatory-compliance-columns';
import { ComplianceModule } from '../shared/compliance-module';
import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';
import { WAZUH_MODULES_ID } from '../../../../../common/constants';

const moduleId = WAZUH_MODULES_ID.FEDRAMP;
export const RegulatoryComplianceFedRAMP = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardFedRAMP,
    section: moduleId,
    moduleId: moduleId,
    dataSource: FedRAMPDataSource,
    tableColumns: createRegulatoryComplianceColumns(
      'wazuh.rule.compliance.fedramp',
    ),
  });

  return <ComplianceModule moduleId={moduleId} tabs={tabs} />;
};

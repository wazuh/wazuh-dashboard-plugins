import React from 'react';
import { DashboardCMMC } from './dashboards/dashboard';
import { CMMCDataSource } from '../../../common/data-source';
import { createRegulatoryComplianceColumns } from '../shared/create-regulatory-compliance-columns';
import { ComplianceModule } from '../shared/compliance-module';
import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';
import { WAZUH_MODULES_ID } from '../../../../../common/constants';

const moduleId = WAZUH_MODULES_ID.CMMC;
export const RegulatoryComplianceCMMC = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardCMMC,
    section: moduleId,
    moduleId: moduleId,
    dataSource: CMMCDataSource,
    tableColumns: createRegulatoryComplianceColumns(
      'wazuh.rule.compliance.cmmc',
    ),
  });

  return <ComplianceModule moduleId={moduleId} tabs={tabs} />;
};

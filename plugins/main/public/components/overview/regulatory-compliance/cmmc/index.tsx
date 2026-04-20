import React from 'react';
import { DashboardCMMC } from './dashboards/dashboard';
import { CMMCDataSource } from '../../../common/data-source';
import { cmmcColumns } from './events/cmmc-columns';
import { ComplianceModule } from '../shared/compliance-module';
import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';

export const RegulatoryComplianceCMMC = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardCMMC,
    section: 'cmmc',
    moduleId: 'cmmc',
    dataSource: CMMCDataSource,
    tableColumns: cmmcColumns,
  });

  return <ComplianceModule moduleId='cmmc' tabs={tabs} />;
};

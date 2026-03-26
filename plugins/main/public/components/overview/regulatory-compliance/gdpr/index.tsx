import React from 'react';
import { DashboardGDPR } from './dashboards/dashboard';
import { GDPRDataSource } from '../../../common/data-source';
import { gdprColumns } from './events/gdpr-columns';
import { ComplianceModule } from '../shared/compliance-module';
import { buildStandardComplianceTabs } from '../shared/compliance-tab-factory';

export const RegulatoryComplianceGDPR = () => {
  const tabs = buildStandardComplianceTabs({
    dashboardComponent: DashboardGDPR,
    section: 'gdpr',
    moduleId: 'gdpr',
    dataSource: GDPRDataSource,
    tableColumns: gdprColumns,
  });

  return <ComplianceModule moduleId='gdpr' tabs={tabs} />;
};

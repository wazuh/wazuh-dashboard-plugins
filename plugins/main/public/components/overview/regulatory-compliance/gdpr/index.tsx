import React from 'react';
import { ModuleSubTabs } from '../../../common/tabs';
import { DashboardGDPR } from './dashboards/dashboard';
import { ComplianceTable } from '../../compliance-table';
import { WazuhDiscover } from '../../../common/wazuh-discover/wz-discover';
import { GDPRDataSource } from '../../../common/data-source';
import { gdprColumns } from './events/gdpr-columns';
import { ButtonExploreAgent } from '../../../wz-agent-selector/button-explore-agent';
import { ButtonModuleGenerateReport as ButtonModuleGenerateReportComponent } from '../../../common/modules/buttons';
import { ReportingService } from '../../../../react-services';
import { WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY } from '../../../../../common/constants';

const ButtonModuleGenerateReport = {
  condition: () => new ReportingService().reportDashboardPluginExist(),
  component: ButtonModuleGenerateReportComponent,
};

const tabs = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
    component: DashboardGDPR,
  },
  {
    id: 'controls',
    name: 'Controls',
    buttons: [ButtonExploreAgent],
    component: (props: any) => (
      <ComplianceTable {...props} section='gdpr' DataSource={GDPRDataSource} />
    ),
  },
  {
    id: 'events',
    name: 'Events',
    buttons: [ButtonExploreAgent],
    component: () => (
      <WazuhDiscover
        moduleId='gdpr'
        tableColumns={gdprColumns}
        DataSource={GDPRDataSource}
        categoriesSampleData={[WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY]}
      />
    ),
  },
];

export const RegulatoryComplianceGDPR = () => <ModuleSubTabs tabs={tabs} />;

import React from 'react';
import { ModuleSubTabs } from '../../../common/tabs';
import { DashboardNIST80053 } from './dashboards/dashboard';
import { ComplianceTable } from '../../compliance-table';
import { WazuhDiscover } from '../../../common/wazuh-discover/wz-discover';
import { NIST80053DataSource } from '../../../common/data-source';
import { nistColumns } from './events/nist-columns';
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
    component: DashboardNIST80053,
  },
  {
    id: 'controls',
    name: 'Controls',
    buttons: [ButtonExploreAgent],
    component: (props: any) => (
      <ComplianceTable
        {...props}
        section='nist'
        DataSource={NIST80053DataSource}
      />
    ),
  },
  {
    id: 'events',
    name: 'Events',
    buttons: [ButtonExploreAgent],
    component: () => (
      <WazuhDiscover
        moduleId='nist'
        tableColumns={nistColumns}
        DataSource={NIST80053DataSource}
        categoriesSampleData={[WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY]}
      />
    ),
  },
];

export const RegulatoryComplianceNIST80053 = () => (
  <ModuleSubTabs tabs={tabs} />
);

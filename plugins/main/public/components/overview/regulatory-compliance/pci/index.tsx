import React from 'react';
import { ModuleSubTabs } from '../../../common/tabs';
import { DashboardPCIDSS } from './dashboards/dashboard';
import { ComplianceTable } from '../../compliance-table';
import { WazuhDiscover } from '../../../common/wazuh-discover/wz-discover';
import { PCIDSSDataSource } from '../../../common/data-source';
import { pciColumns } from './events/pci-columns';
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
    component: DashboardPCIDSS,
  },
  {
    id: 'controls',
    name: 'Controls',
    buttons: [ButtonExploreAgent],
    component: (props: any) => (
      <ComplianceTable {...props} section='pci' DataSource={PCIDSSDataSource} />
    ),
  },
  {
    id: 'events',
    name: 'Events',
    buttons: [ButtonExploreAgent],
    component: () => (
      <WazuhDiscover
        moduleId='pci'
        tableColumns={pciColumns}
        DataSource={PCIDSSDataSource}
        categoriesSampleData={[WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY]}
      />
    ),
  },
];

export const RegulatoryCompliancePCIDSS = () => <ModuleSubTabs tabs={tabs} />;

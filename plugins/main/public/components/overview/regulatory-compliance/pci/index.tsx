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
import {
  TAB_VIEW_ID_DASHBOARD,
  TAB_VIEW_ID_EVENTS,
  TAB_VIEW_NAME_DASHBOARD,
  TAB_VIEW_NAME_EVENTS,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';

const ButtonModuleGenerateReport = {
  condition: () => new ReportingService().reportDashboardPluginExist(),
  component: ButtonModuleGenerateReportComponent,
};

const tabs = [
  {
    id: TAB_VIEW_ID_DASHBOARD,
    name: TAB_VIEW_NAME_DASHBOARD,
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
    id: TAB_VIEW_ID_EVENTS,
    name: TAB_VIEW_NAME_EVENTS,
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

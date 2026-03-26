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
    id: TAB_VIEW_ID_EVENTS,
    name: TAB_VIEW_NAME_EVENTS,
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

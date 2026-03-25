import React from 'react';
import { ModuleSubTabs } from '../../../common/tabs';
import { DashboardHIPAA } from './dashboards/dashboard';
import { ComplianceTable } from '../../compliance-table';
import { WazuhDiscover } from '../../../common/wazuh-discover/wz-discover';
import { HIPAADataSource } from '../../../common/data-source';
import { hipaaColumns } from './events/hipaa-columns';
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
    component: DashboardHIPAA,
  },
  {
    id: 'controls',
    name: 'Controls',
    buttons: [ButtonExploreAgent],
    component: (props: any) => (
      <ComplianceTable
        {...props}
        section='hipaa'
        DataSource={HIPAADataSource}
      />
    ),
  },
  {
    id: 'events',
    name: 'Events',
    buttons: [ButtonExploreAgent],
    component: () => (
      <WazuhDiscover
        moduleId='hipaa'
        tableColumns={hipaaColumns}
        DataSource={HIPAADataSource}
        categoriesSampleData={[WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY]}
      />
    ),
  },
];

export const RegulatoryComplianceHIPAA = () => <ModuleSubTabs tabs={tabs} />;

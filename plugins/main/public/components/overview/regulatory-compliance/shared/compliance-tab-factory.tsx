import React from 'react';
import { ComplianceTable } from '../../compliance-table';
import { WazuhDiscover } from '../../../common/wazuh-discover/wz-discover';
import { ButtonExploreAgent } from '../../../wz-agent-selector/button-explore-agent';
import { ButtonModuleGenerateReport as ButtonModuleGenerateReportComponent } from '../../../common/modules/buttons';
import { ReportingService } from '../../../../react-services';
import {
  TAB_VIEW_ID_DASHBOARD,
  TAB_VIEW_ID_EVENTS,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';
import { moduleTabsI18n } from '../../../../utils/module-tabs-i18n';
import { complianceI18n } from '../i18n';

const ButtonModuleGenerateReport = {
  condition: () => new ReportingService().reportDashboardPluginExist(),
  component: ButtonModuleGenerateReportComponent,
};

export interface ComplianceTabParams {
  dashboardComponent: React.ComponentType<any>;
  section: string;
  moduleId: string;
  dataSource: any;
  tableColumns: any[];
}

export const buildStandardComplianceTabs = ({
  dashboardComponent: DashboardComponent,
  section,
  moduleId,
  dataSource,
  tableColumns,
}: ComplianceTabParams) => {
  return [
    {
      id: TAB_VIEW_ID_DASHBOARD,
      name: moduleTabsI18n.dashboard,
      buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
      component: DashboardComponent,
    },
    {
      id: 'controls',
      name: complianceI18n.controls,
      buttons: [ButtonExploreAgent],
      component: (props: any) => (
        <ComplianceTable {...props} section={section} DataSource={dataSource} />
      ),
    },
    {
      id: TAB_VIEW_ID_EVENTS,
      name: moduleTabsI18n.findings,
      buttons: [ButtonExploreAgent],
      component: () => (
        <WazuhDiscover
          moduleId={moduleId}
          tableColumns={tableColumns}
          DataSource={dataSource}
          categoriesSampleData={[WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY]}
        />
      ),
    },
  ];
};

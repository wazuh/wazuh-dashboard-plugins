import React from 'react';
import { i18n } from '@osd/i18n';
import { ComplianceTable } from '../../compliance-table';
import { WazuhDiscover } from '../../../common/wazuh-discover/wz-discover';
import {
  TAB_VIEW_ID_DASHBOARD,
  TAB_VIEW_ID_EVENTS,
  TAB_VIEW_NAME_DASHBOARD,
  TAB_VIEW_NAME_EVENTS,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';
import { COMPLIANCE_TAB_ID_CONTROLS } from './constants';

export interface ComplianceTabParams {
  dashboardComponent: React.ComponentType<any>;
  section: string;
  moduleId: string;
  dataSource: any;
  tableColumns: any[];
}

/**
 * Sub-tabs of a framework. Their buttons live in the framework tab of the module header (see
 * `ButtonComplianceGenerateReport`), as the sub-tabs do not render buttons.
 */
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
      name: TAB_VIEW_NAME_DASHBOARD,
      component: DashboardComponent,
    },
    {
      id: COMPLIANCE_TAB_ID_CONTROLS,
      name: i18n.translate('wazuh.regulatoryCompliance.tabs.controls', {
        defaultMessage: 'Controls',
      }),
      component: (props: any) => (
        <ComplianceTable {...props} section={section} DataSource={dataSource} />
      ),
    },
    {
      id: TAB_VIEW_ID_EVENTS,
      name: TAB_VIEW_NAME_EVENTS,
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

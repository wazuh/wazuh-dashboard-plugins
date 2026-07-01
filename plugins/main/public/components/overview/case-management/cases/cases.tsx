import React from 'react';
import { InventoryDashboardTable } from '../../../common/dashboards';
import {
  CasesDataSource,
  FindingsDataSourceRepository,
} from '../../../common/data-source';
import { caseManagementDocumentDetailsTabs } from '../../../common/document-details/case-management';
import { THREAT_HUNTING_CASES_DASHBOARD_ID } from '../../../../../common/constants';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';

const CASES_DASHBOARD_PANELS = [
  { dashboardId: THREAT_HUNTING_CASES_DASHBOARD_ID },
];

export const CaseManagementCases = () => {
  return (
    <InventoryDashboardTable
      DataSource={CasesDataSource}
      DataSourceRepositoryCreator={FindingsDataSourceRepository}
      tableDefaultColumns={tableColumns}
      managedFilters={managedFilters}
      getDashboardPanels={CASES_DASHBOARD_PANELS}
      tableId='case-management-cases'
      additionalDocumentDetailsTabs={caseManagementDocumentDetailsTabs}
    />
  );
};

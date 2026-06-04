import React from 'react';
import { InventoryDashboardTable } from '../../../common/dashboards';
import {
  CasesDataSource,
  FindingsDataSourceRepository,
} from '../../../common/data-source';
import { CaseManagementTab } from '../../../common/document-details/case-management';
import { THREAT_HUNTING_CASES_DASHBOARD_ID } from '../../../../../common/constants';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';

const caseDocumentDetailsTabs = ({ document }: { document: any }) => [
  {
    id: 'case-management',
    name: 'Case',
    content: (
      <CaseManagementTab
        document={{ _index: document._index, _id: document._id }}
      />
    ),
  },
];

export const ThreatHuntingCases = () => {
  return (
    <InventoryDashboardTable
      DataSource={CasesDataSource}
      DataSourceRepositoryCreator={FindingsDataSourceRepository}
      tableDefaultColumns={tableColumns}
      managedFilters={managedFilters}
      getDashboardPanels={[{ dashboardId: THREAT_HUNTING_CASES_DASHBOARD_ID }]}
      tableId='threat-hunting-cases'
      additionalDocumentDetailsTabs={caseDocumentDetailsTabs}
    />
  );
};

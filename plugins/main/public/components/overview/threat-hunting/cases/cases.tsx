import React, { useCallback, useState } from 'react';
import { InventoryDashboardTable } from '../../../common/dashboards';
import {
  CasesDataSource,
  FindingsDataSourceRepository,
} from '../../../common/data-source';
import { CaseManagementTab } from '../../../common/document-details/case-management';
import { THREAT_HUNTING_CASES_DASHBOARD_ID } from '../../../../../common/constants';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';

const CASES_DASHBOARD_PANELS = [
  { dashboardId: THREAT_HUNTING_CASES_DASHBOARD_ID },
];

export const ThreatHuntingCases = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshDashboard = useCallback(() => {
    setRefreshKey(numericKey => numericKey + 1);
  }, []);

  const caseDocumentDetailsTabs = useCallback(
    ({ document }: { document: any }) => [
      {
        id: 'case-management',
        name: 'Case',
        content: (
          <CaseManagementTab
            document={{ _index: document._index, _id: document._id }}
            onSaveSuccess={refreshDashboard}
          />
        ),
      },
    ],
    [refreshDashboard],
  );

  return (
    <InventoryDashboardTable
      DataSource={CasesDataSource}
      DataSourceRepositoryCreator={FindingsDataSourceRepository}
      tableDefaultColumns={tableColumns}
      managedFilters={managedFilters}
      getDashboardPanels={CASES_DASHBOARD_PANELS}
      tableId='threat-hunting-cases'
      additionalDocumentDetailsTabs={caseDocumentDetailsTabs}
      externalRefreshKey={refreshKey}
    />
  );
};

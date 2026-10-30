import React from 'react';
import { render } from '@testing-library/react';
import { ITHygieneInventoryDashboardTable } from './inventory';

const mockTable = jest.fn((_props: any) => <div data-test-subj='table' />);

jest.mock('../../../../common/wazuh-discover/table', () => ({
  TableDataGridWithSearchBarInspectedHit: (props: any) => mockTable(props),
  useTableDataGridFetch: () => ({
    results: { hits: { total: 1 } },
    dataGridProps: {},
    inspectedHit: undefined,
    removeInspectedHit: jest.fn(),
  }),
}));

jest.mock('../../../../common/hooks/use-data-source-search-context', () => ({
  useDataSourceWithSearchBar: () => ({
    dataSource: { id: 'ds', indexPattern: { id: 'ip' } },
    filters: [],
    fetchFilters: [],
    fixedFilters: [],
    isDataSourceLoading: false,
    setFilters: jest.fn(),
    fetchData: jest.fn(),
    fingerprint: 0,
    autoRefreshFingerprint: 0,
    searchBarProps: {
      query: { query: 'package.name:*rpm*', language: 'kuery' },
      dateRangeFrom: 'now-15m',
      dateRangeTo: 'now',
    },
    error: undefined,
  }),
}));

jest.mock('../../../../../kibana-services', () => ({
  getPlugins: () => ({
    dashboard: { DashboardContainerByValueRenderer: () => null },
  }),
}));

jest.mock('../../../../../../../../src/plugins/data/public/', () => ({}));
jest.mock('../../../../../../../../src/plugins/embeddable/public', () => ({
  ViewMode: { VIEW: 'view' },
}));
jest.mock('../../../../common/custom-search-bar/custom-search-bar', () => ({}));
jest.mock('../../../../common/custom-search-bar', () => ({
  CustomSearchBar: () => null,
}));
jest.mock('../../../../navigation/tabs-managed-by-search-params', () => ({
  TabsManagedBySearchParam: () => null,
}));
jest.mock('../../../../common/hocs', () => ({
  HideOnErrorInitializatingDataSource: ({ children }: any) => children,
  PromptErrorInitializatingDataSource: () => null,
}));
jest.mock(
  '../../../../common/loading-searchbar-progress/loading-searchbar-progress',
  () => ({ LoadingSearchbarProgress: () => null }),
);
jest.mock('../../../../common/no-results/no-results', () => ({
  DiscoverNoResults: () => null,
}));
jest.mock('../../../../visualize/components', () => ({
  SampleDataWarning: () => null,
}));

describe('ITHygieneInventoryDashboardTable', () => {
  it('passes the search bar query to the table so the export uses it', () => {
    render(
      <ITHygieneInventoryDashboardTable
        DataSource={{}}
        DataSourceRepositoryCreator={{}}
        tableDefaultColumns={[{ id: 'package.name' }]}
        getDashboardPanels={() => ({})}
        managedFilters={[]}
        tableId={'inventory-packages' as any}
        indexPattern={undefined as any}
      />,
    );

    expect(mockTable).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { query: 'package.name:*rpm*', language: 'kuery' },
      }),
    );
  });
});

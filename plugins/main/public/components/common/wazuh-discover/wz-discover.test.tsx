import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { queryDataTestAttr } from '../../../../test/public/query-attr';
import { WazuhDiscover } from './wz-discover';

jest.mock('../../../kibana-services', () => ({
  getPlugins: () => ({
    dashboard: { DashboardContainerByValueRenderer: () => null },
  }),
  getWazuhCorePlugin: () => ({ hooks: { useDockedSideNav: () => false } }),
}));
jest.mock('@elastic/eui', () => ({
  ...jest.requireActual('@elastic/eui'),
  EuiDataGrid: () => null,
}));
jest.mock('../data-source', () => ({
  useDataSource: jest.fn(),
  FindingsDataSourceRepository: jest.fn(),
}));
jest.mock('../data-grid', () => ({
  useDataGrid: () => ({
    pagination: { pageIndex: 0, pageSize: 15 },
    setPagination: jest.fn(),
    sorting: [],
    columnVisibility: { visibleColumns: [] },
  }),
  exportSearchToCSV: jest.fn(),
  getAllCustomRenders: jest.fn(),
  toEuiDataGridProps: () => ({}),
}));
jest.mock('../search-bar/use-search-bar', () => ({
  __esModule: true,
  default: () => ({
    searchBarProps: {
      query: { query: '' },
      dateRangeFrom: '',
      dateRangeTo: '',
    },
    fingerprint: 0,
    autoRefreshFingerprint: 0,
  }),
}));
jest.mock('../search-bar', () => ({ WzSearchBar: () => null }));
jest.mock('../search-bar/search-bar-service', () => ({
  transformDateRange: range => range,
}));
jest.mock('../hocs', () => ({
  withErrorBoundary: Component => Component,
  HideOnErrorInitializatingDataSource: ({ children }) => children,
  PromptErrorInitializatingDataSource: () => null,
}));
jest.mock('../../visualize/components', () => ({
  SampleDataWarning: () => null,
}));
jest.mock('../unsaved-changes-guard', () => ({
  UnsavedChangesGuardedFlyout: () => null,
}));
jest.mock('../../../react-services/error-management', () => ({
  ErrorHandler: { handleError: jest.fn() },
  ErrorFactory: { create: jest.fn() },
  HttpError: jest.fn(),
}));
jest.mock('./config/histogram-chart', () => ({
  histogramChartInput: jest.fn(),
}));
jest.mock('./render-columns', () => ({ wzDiscoverRenderColumns: [] }));
jest.mock('./use-document-mutation-sync', () => ({
  useDocumentMutationSync: () => ({
    onDocumentMutated: jest.fn(),
    caseRefreshKey: 0,
  }),
}));
jest.mock('./components/data-grid-additional-controls', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./components/doc-details-header', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./components/document-view-table-and-json', () => ({
  DocumentViewTableAndJson: () => null,
}));

const { useDataSource } = jest.requireMock('../data-source');

const mockDataSourceWithHits = (total: number) =>
  useDataSource.mockReturnValue({
    dataSource: { id: 'index-pattern-id', indexPattern: {} },
    filters: [],
    fetchFilters: [],
    fixedFilters: [],
    isLoading: false,
    fetchData: jest.fn().mockResolvedValue({ hits: { total, hits: [] } }),
    setFilters: jest.fn(),
    error: undefined,
  });

const discoverProps = {
  moduleId: 'fim',
  tableColumns: [],
  DataSource: jest.fn(),
  categoriesSampleData: [],
};
const EMPTY_STATE_TEXT = 'No files yet';
const EMPTY_STATE = <div>{EMPTY_STATE_TEXT}</div>;
const NO_RESULTS = queryDataTestAttr('discoverNoResults');

describe('WazuhDiscover', () => {
  it('renders the default no results callout when there are no hits', async () => {
    mockDataSourceWithHits(0);

    const { container } = render(<WazuhDiscover {...discoverProps} />);

    await waitFor(() =>
      expect(container.querySelector(NO_RESULTS)).toBeInTheDocument(),
    );
  });

  it('renders the module empty state instead when it is given', async () => {
    mockDataSourceWithHits(0);

    const { container } = render(
      <WazuhDiscover {...discoverProps} emptyState={EMPTY_STATE} />,
    );

    expect(await screen.findByText(EMPTY_STATE_TEXT)).toBeInTheDocument();
    expect(container.querySelector(NO_RESULTS)).toBeNull();
  });
});

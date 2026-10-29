import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { queryDataTestAttr } from '../../../../test/public/query-attr';
import { WazuhDiscover } from './wz-discover';

const mockFetchData = jest.fn();

jest.mock('../../../kibana-services', () => ({
  getPlugins: () => ({
    dashboard: { DashboardContainerByValueRenderer: () => null },
  }),
  getWazuhCorePlugin: () => ({ hooks: { useDockedSideNav: () => false } }),
}));
jest.mock('../data-source', () => ({
  useDataSource: () => ({
    dataSource: { id: 'index-pattern-id', indexPattern: {} },
    filters: [],
    fetchFilters: [],
    fixedFilters: [],
    isLoading: false,
    fetchData: mockFetchData,
    setFilters: jest.fn(),
  }),
  FindingsDataSourceRepository: jest.fn(),
}));
jest.mock('../../../react-services/app-state', () => ({}));
jest.mock('../search-bar/use-search-bar', () => ({
  __esModule: true,
  default: () => ({
    searchBarProps: {
      query: { query: '' },
      dateRangeFrom: '',
      dateRangeTo: '',
    },
  }),
}));
jest.mock('../search-bar/search-bar-service', () => ({
  transformDateRange: range => range,
}));
jest.mock('../search-bar', () => ({ WzSearchBar: () => null }));
jest.mock('../../../react-services/error-management', () => ({
  ErrorHandler: { handleError: jest.fn() },
  ErrorFactory: { create: jest.fn() },
  HttpError: jest.fn(),
}));

const renderDiscover = (emptyState?: React.ReactNode) =>
  render(
    <WazuhDiscover
      moduleId='fim'
      tableColumns={[]}
      DataSource={jest.fn()}
      categoriesSampleData={[]}
      emptyState={emptyState}
    />,
  ).container;

const NO_RESULTS = queryDataTestAttr('discoverNoResults');

describe('WazuhDiscover', () => {
  beforeEach(() => {
    mockFetchData.mockResolvedValue({ hits: { total: 0, hits: [] } });
  });

  it('renders the default no results callout when there are no hits', async () => {
    const container = renderDiscover();

    await waitFor(() =>
      expect(container.querySelector(NO_RESULTS)).toBeInTheDocument(),
    );
  });

  it('renders the module empty state instead when it is given', async () => {
    const container = renderDiscover(<div>No files yet</div>);

    expect(await screen.findByText('No files yet')).toBeInTheDocument();
    expect(container.querySelector(NO_RESULTS)).toBeNull();
  });

  it('renders the permission prompt instead of the table on a 403', async () => {
    mockFetchData.mockRejectedValue({ status: 403, message: 'Forbidden' });
    const container = renderDiscover();

    await waitFor(() =>
      expect(
        container.querySelector(
          queryDataTestAttr('query-error-prompt-permission-denied'),
        ),
      ).toBeInTheDocument(),
    );
    expect(container.querySelector(NO_RESULTS)).toBeNull();
  });
});

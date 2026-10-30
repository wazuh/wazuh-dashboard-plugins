import '@testing-library/jest-dom';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { queryDataTestAttr } from '../../../../test/public/query-attr';
import { InventoryDashboardTable } from './inventory';
import { exportSearchToCSV } from '../data-grid';

const mockFetchData = jest.fn();
const mockIndexPattern = Object.assign([], {
  getByName: (name: string) =>
    ['wazuh.agent.name', 'state.modified_at'].includes(name) || undefined,
});

jest.mock('../../../kibana-services', () => ({
  ...jest.requireActual('../../../kibana-services'),
  getWazuhCorePlugin: () => ({ hooks: { useDockedSideNav: () => false } }),
}));
jest.mock('../hooks/use-data-source-search-context', () => ({
  useDataSourceWithSearchBar: () => ({
    dataSource: {
      indexPattern: {
        title: 'wazuh-states-inventory-packages*',
        fields: mockIndexPattern,
      },
    },
    filters: [],
    fetchFilters: [],
    fixedFilters: [],
    isLoading: false,
    fetchData: mockFetchData,
    setFilters: jest.fn(),
    searchBarProps: { query: { query: 'package.name:curl' } },
  }),
}));
jest.mock('../data-grid', () => ({
  ...jest.requireActual('../data-grid'),
  exportSearchToCSV: jest.fn(),
}));
jest.mock('../hocs', () => ({
  ...jest.requireActual('../hocs'),
  withDataSourceLoading: () => Component => Component,
  withDataSourceInitiated: () => Component => Component,
}));
jest.mock('../custom-search-bar', () => ({ CustomSearchBar: () => null }));
jest.mock('../../visualize/components', () => ({
  SampleDataWarning: () => <div data-test-subj='sample-data-warning' />,
}));
jest.mock('./dashboard-renderer/dashboard-renderer', () => () => null);
jest.mock('../../../react-services/error-management', () => ({
  ErrorHandler: { handleError: jest.fn() },
  ErrorFactory: { create: jest.fn() },
  HttpError: jest.fn(),
}));

const mockStore = configureMockStore();

const renderInventory = (store = mockStore({})) =>
  render(
    <Provider store={store}>
      <InventoryDashboardTable
        DataSource={jest.fn()}
        DataSourceRepositoryCreator={jest.fn()}
        tableDefaultColumns={[]}
        getDashboardPanels={[]}
        managedFilters={[]}
        tableId='it-hygiene-inventory-packages'
        categoriesSampleData={['sample']}
      />
    </Provider>,
  );

const getPublishedTableContexts = store =>
  store
    .getActions()
    .filter(action => action.type === 'UPDATE_REPORTING_TABLE_CONTEXT')
    .map(action => action.tableReportContext);

describe('InventoryDashboardTable', () => {
  it('renders only the permission prompt on a 403', async () => {
    mockFetchData.mockRejectedValue({ status: 403, message: 'Forbidden' });
    const { container } = renderInventory();

    await waitFor(() =>
      expect(
        container.querySelector(
          queryDataTestAttr('query-error-prompt-permission-denied'),
        ),
      ).toBeInTheDocument(),
    );
    expect(container.querySelector('.wz-table-data-grid')).toBeNull();
    expect(
      container.querySelector(queryDataTestAttr('sample-data-warning'))
        ?.parentElement,
    ).toHaveClass('wz-no-display');
  });

  it('publishes its table for the Generate report button', async () => {
    mockFetchData.mockResolvedValue({ hits: { total: 0, hits: [] } });
    const store = mockStore({});
    const { unmount } = renderInventory(store);

    await waitFor(() =>
      expect(getPublishedTableContexts(store).at(-1)).toEqual(
        expect.objectContaining({ totalResults: 0 }),
      ),
    );

    await getPublishedTableContexts(store).at(-1).generateReport();

    expect(exportSearchToCSV).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { query: 'package.name:curl' },
        fields: ['wazuh.agent.name', 'state.modified_at'],
      }),
      { fileName: 'packages' },
    );

    unmount();
    expect(getPublishedTableContexts(store).at(-1)).toBeNull();
  });
});

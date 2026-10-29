import '@testing-library/jest-dom';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { queryDataTestAttr } from '../../../../test/public/query-attr';
import { InventoryDashboardTable } from './inventory';

const mockFetchData = jest.fn();

jest.mock('../../../kibana-services', () => ({
  ...jest.requireActual('../../../kibana-services'),
  getWazuhCorePlugin: () => ({ hooks: { useDockedSideNav: () => false } }),
}));
jest.mock('../hooks/use-data-source-search-context', () => ({
  useDataSourceWithSearchBar: () => ({
    dataSource: {
      indexPattern: { title: 'wazuh-states-inventory-packages*', fields: [] },
    },
    filters: [],
    fetchFilters: [],
    fixedFilters: [],
    isLoading: false,
    fetchData: mockFetchData,
    setFilters: jest.fn(),
    searchBarProps: { query: { query: '' } },
  }),
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

describe('InventoryDashboardTable', () => {
  it('renders only the permission prompt on a 403', async () => {
    mockFetchData.mockRejectedValue({ status: 403, message: 'Forbidden' });
    const { container } = render(
      <InventoryDashboardTable
        DataSource={jest.fn()}
        DataSourceRepositoryCreator={jest.fn()}
        tableDefaultColumns={[]}
        getDashboardPanels={[]}
        managedFilters={[]}
        tableId='it-hygiene-packages'
        categoriesSampleData={['sample']}
      />,
    );

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
});

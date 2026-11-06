import '@testing-library/jest-dom';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { queryDataTestAttr } from '../../../../../../test/public/query-attr';
import { InventoryVuls } from './inventory';

const mockFetchData = jest.fn();

jest.mock('../../../../../kibana-services', () => ({
  ...jest.requireActual('../../../../../kibana-services'),
  getWazuhCorePlugin: () => ({ hooks: { useDockedSideNav: () => false } }),
}));
jest.mock('../../../../common/data-source/hooks', () => ({
  useDataSource: () => ({
    dataSource: {
      indexPattern: { title: 'wazuh-states-vulnerabilities*', fields: [] },
    },
    filters: [],
    fetchFilters: [],
    fixedFilters: [],
    isLoading: false,
    fetchData: mockFetchData,
    setFilters: jest.fn(),
  }),
}));
jest.mock('../../../../common/search-bar/use-search-bar', () => ({
  __esModule: true,
  default: () => ({ searchBarProps: { query: { query: '' } } }),
}));
jest.mock('../../../../common/hocs', () => ({
  HideOnErrorInitializatingDataSource: ({ children }) => children,
  PromptErrorInitializatingDataSource: () => null,
  withErrorBoundary: Component => Component,
}));
jest.mock(
  '../../common/hocs/validate-vulnerabilities-states-index-pattern',
  () => ({ withVulnerabilitiesStateDataSource: Component => Component }),
);
jest.mock('../../common/components/check-module-enabled', () => ({
  ModuleEnabledCheck: () => null,
}));
jest.mock('../../../../common/custom-search-bar', () => ({
  CustomSearchBar: () => null,
}));
jest.mock('../../../../visualize/components', () => ({
  SampleDataWarning: () => null,
}));
jest.mock(
  '../../../../common/dashboards/dashboard-renderer/dashboard-renderer',
  () => () => null,
);
jest.mock('../../../../../react-services/error-management', () => ({
  ErrorHandler: { handleError: jest.fn() },
  ErrorFactory: { create: jest.fn() },
  HttpError: jest.fn(),
}));

describe('InventoryVuls', () => {
  it('renders the permission prompt instead of the table on a 403', async () => {
    mockFetchData.mockRejectedValue({ status: 403, message: 'Forbidden' });
    const { container } = render(<InventoryVuls />);

    await waitFor(() =>
      expect(
        container.querySelector(
          queryDataTestAttr('query-error-prompt-permission-denied'),
        ),
      ).toBeInTheDocument(),
    );
    expect(container.querySelector('.euiDataGrid')).toBeNull();
  });
});

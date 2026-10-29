import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { queryDataTestAttr } from '../../../../test/public/query-attr';
import { createDashboard } from './dashboard';
import { useReportingCommunicateSearchContext } from '../hooks/use-reporting-communicate-search-context';

let mockDataSourceAction: { data?: unknown; error?: unknown };

jest.mock('../hocs', () => {
  const { createElement } = jest.requireActual('react');
  return {
    withErrorBoundary: Component => Component,
    withInjectProps: inject => Component => props =>
      createElement(Component, { ...props, ...inject }),
    // Simulates a data source fetch; each test sets its outcome
    withDataSourceFetchSearchBar: () => Component => props =>
      createElement(Component, {
        ...props,
        dataSource: {
          dataSource: {
            isLoading: false,
            indexPattern: {
              title: 'wazuh-states-inventory-*',
              timeFieldName: 'timestamp',
            },
            getPinnedAgentFilter: () => [],
          },
          searchBarProps: {},
          fixedFilters: [],
          fetchFilters: [],
        },
        dataSourceAction: mockDataSourceAction,
      }),
  };
});
jest.mock('../loading-searchbar-progress/loading-searchbar-progress', () => ({
  LoadingSearchbarProgress: () => null,
}));
jest.mock('../hooks/use-reporting-communicate-search-context', () => ({
  useReportingCommunicateSearchContext: jest.fn(),
}));
jest.mock('../search-bar', () => ({ WzSearchBar: () => null }));
jest.mock('../../visualize/components', () => ({
  SampleDataWarning: () => null,
}));
jest.mock('./dashboard-renderer/dashboard-renderer', () => ({
  __esModule: true,
  default: () => null,
}));

const renderDashboard = (emptyState?: React.ReactNode) => {
  const ModuleDashboard = createDashboard({
    DataSource: jest.fn(),
    DataSourceRepositoryCreator: jest.fn(),
    getDashboardPanels: [{ dashboardId: 'dashboard-id' }],
    emptyState,
  });
  const { container } = render(<ModuleDashboard />);
  return container.querySelector(queryDataTestAttr('discoverNoResults'));
};

describe('createDashboard', () => {
  beforeEach(() => {
    mockDataSourceAction = { data: { hits: { total: 0 } } };
  });

  it('renders the default no results callout when there are no hits', () => {
    expect(renderDashboard()).toBeInTheDocument();
  });

  it('renders the module empty state instead when it is given', () => {
    expect(renderDashboard(<div>No files yet</div>)).toBeNull();
    expect(screen.getByText('No files yet')).toBeInTheDocument();
  });

  it('renders a permission prompt naming the index pattern when the search is forbidden', () => {
    mockDataSourceAction = {
      data: null,
      error: Object.assign(new Error('security_exception'), { status: 403 }),
    };
    expect(renderDashboard()).toBeNull();
    expect(
      screen.getByText("You don't have permission to view this data."),
    ).toBeInTheDocument();
    expect(screen.getByText(/wazuh-states-inventory-\*/)).toBeInTheDocument();
  });

  it('surfaces any other search error instead of a blank page', () => {
    mockDataSourceAction = { data: null, error: new Error('Gateway Timeout') };
    renderDashboard();
    expect(screen.getByText('Gateway Timeout')).toBeInTheDocument();
  });

  it('reports no results to the report button while a search error shows', () => {
    // A failed refetch keeps the hits of the previous successful one
    mockDataSourceAction = {
      data: { hits: { total: 5 } },
      error: Object.assign(new Error('security_exception'), { status: 403 }),
    };
    renderDashboard();
    expect(useReportingCommunicateSearchContext).toHaveBeenLastCalledWith(
      expect.objectContaining({ totalResults: 0 }),
    );
  });
});

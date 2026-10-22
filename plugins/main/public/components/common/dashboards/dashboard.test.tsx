import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { queryDataTestAttr } from '../../../../test/public/query-attr';
import { createDashboard } from './dashboard';

jest.mock('../hocs', () => {
  const { createElement } = jest.requireActual('react');
  return {
    withErrorBoundary: Component => Component,
    withInjectProps: inject => Component => props =>
      createElement(Component, { ...props, ...inject }),
    // Simulates a data source fetch without hits
    withDataSourceFetchSearchBar: () => Component => props =>
      createElement(Component, {
        ...props,
        dataSource: {
          dataSource: {
            isLoading: false,
            indexPattern: { timeFieldName: 'timestamp' },
            getPinnedAgentFilter: () => [],
          },
          searchBarProps: {},
          fixedFilters: [],
          fetchFilters: [],
        },
        dataSourceAction: { data: { hits: { total: 0 } } },
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
  it('renders the default no results callout when there are no hits', () => {
    expect(renderDashboard()).toBeInTheDocument();
  });

  it('renders the module empty state instead when it is given', () => {
    expect(renderDashboard(<div>No files yet</div>)).toBeNull();
    expect(screen.getByText('No files yet')).toBeInTheDocument();
  });
});

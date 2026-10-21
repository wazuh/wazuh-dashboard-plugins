import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { queryDataTestAttr } from '../../../../test/public/query-attr';
import { createDashboard, Dashboard } from './dashboard';

let mockFetchedProps = {};

jest.mock('../hocs', () => {
  const { createElement } = jest.requireActual('react');
  return {
    withErrorBoundary: Component => Component,
    withInjectProps: inject => Component => props =>
      createElement(Component, { ...props, ...inject }),
    // Simulates the data source fetch by injecting its resulting props
    withDataSourceFetchSearchBar: () => Component => props =>
      createElement(Component, { ...props, ...mockFetchedProps }),
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

const fetchedProps = (total: number) => ({
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
  dataSourceAction: { data: { hits: { total } } },
});

const panels = [{ dashboardId: 'dashboard-id' }];
const EMPTY_STATE_TEXT = 'No files yet';
const EMPTY_STATE = <div>{EMPTY_STATE_TEXT}</div>;
const NO_RESULTS = queryDataTestAttr('discoverNoResults');

describe('Dashboard', () => {
  it('renders the default no results callout when there are no hits', () => {
    const { container } = render(
      <Dashboard {...fetchedProps(0)} getDashboardPanels={panels} />,
    );

    expect(container.querySelector(NO_RESULTS)).toBeInTheDocument();
  });

  it('renders the module empty state instead when it is given', () => {
    const { container } = render(
      <Dashboard
        {...fetchedProps(0)}
        getDashboardPanels={panels}
        emptyState={EMPTY_STATE}
      />,
    );

    expect(screen.getByText(EMPTY_STATE_TEXT)).toBeInTheDocument();
    expect(container.querySelector(NO_RESULTS)).toBeNull();
  });

  it('renders no empty state when there are hits', () => {
    const { container } = render(
      <Dashboard
        {...fetchedProps(3)}
        getDashboardPanels={panels}
        emptyState={EMPTY_STATE}
      />,
    );

    expect(screen.queryByText(EMPTY_STATE_TEXT)).toBeNull();
    expect(container.querySelector(NO_RESULTS)).toBeNull();
  });
});

describe('createDashboard', () => {
  it('passes the module empty state through to the dashboard', () => {
    mockFetchedProps = fetchedProps(0);
    const ModuleDashboard = createDashboard({
      DataSource: jest.fn(),
      DataSourceRepositoryCreator: jest.fn(),
      getDashboardPanels: panels,
      emptyState: EMPTY_STATE,
    });

    render(<ModuleDashboard />);

    expect(screen.getByText(EMPTY_STATE_TEXT)).toBeInTheDocument();
  });
});

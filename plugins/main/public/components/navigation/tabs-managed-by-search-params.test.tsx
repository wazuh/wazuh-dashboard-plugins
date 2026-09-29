import React from 'react';
import { createMemoryHistory, History } from 'history';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabsManagedBySearchParam } from './tabs-managed-by-search-params';
import NavigationService from '../../react-services/navigation-service';

const tabs = [
  {
    id: 'packages',
    name: 'Packages',
    component: () => <div>Packages content</div>,
  },
  {
    id: 'hotfixes',
    name: 'Windows KBs',
    component: () => <div>Hotfixes content</div>,
  },
];

describe('TabsManagedBySearchParam component', () => {
  let history: History;

  beforeEach(() => {
    history = createMemoryHistory();
    NavigationService.getInstance(history);
  });

  const renderComponent = () =>
    render(
      <TabsManagedBySearchParam
        tabs={tabs}
        searchParamNavigation='tabSubView'
        tabsProps={{}}
      />,
    );

  it('renders the tab matching the search parameter', () => {
    history.push('/overview?tab=it-hygiene&tabSubView=hotfixes');

    renderComponent();

    expect(screen.getByText('Hotfixes content')).toBeTruthy();
    expect(history.location.search).toBe('?tab=it-hygiene&tabSubView=hotfixes');
  });

  it('renders the first tab when the search parameter is missing', () => {
    history.push('/overview?tab=it-hygiene');

    renderComponent();

    expect(screen.getByText('Packages content')).toBeTruthy();
    expect(history.location.search).toBe('?tab=it-hygiene&tabSubView=packages');
  });

  it('renders the first tab when the search parameter belongs to another module', () => {
    // `os` is a sub tab of another module tab, so it matches none of these tabs
    history.push('/overview?tab=it-hygiene&tabView=software&tabSubView=os');

    renderComponent();

    expect(screen.getByText('Packages content')).toBeTruthy();
    expect(history.location.search).toBe(
      '?tab=it-hygiene&tabView=software&tabSubView=packages',
    );
  });

  it('replaces the history entry when it falls back to the first tab', () => {
    history.push('/overview?tab=it-hygiene&tabSubView=os');
    const entries = history.length;

    renderComponent();

    expect(history.length).toBe(entries);
  });

  it('navigates to the clicked tab', async () => {
    history.push('/overview?tab=it-hygiene&tabSubView=packages');

    renderComponent();

    await act(async () => {
      await userEvent.click(screen.getByText('Windows KBs'));
    });

    expect(history.location.search).toBe('?tab=it-hygiene&tabSubView=hotfixes');
    expect(screen.getByText('Hotfixes content')).toBeTruthy();
  });
});

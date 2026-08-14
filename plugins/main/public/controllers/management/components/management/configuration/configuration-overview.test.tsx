/* eslint-disable camelcase -- the store fixture reproduces the redux state
field names verbatim. */
/*
 * The report is read by the switch, which hands it down: whether one exists
 * decides whether this page is rendered at all, so the overview only says when
 * the agent reported.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import WzConfigurationOverview from './configuration-overview';

jest.mock('../../../../../kibana-services', () => ({
  getUiSettings: () => ({ get: () => false }),
  getCore: () => ({ application: {} }),
  // The permissions button reaches AppState, which wants a cookie jar on import.
  getCookies: () => ({ get: () => undefined, set: () => {}, remove: () => {} }),
  setCookies: () => {},
  getWzCurrentAppID: () => 'wazuh',
}));

const store = configureMockStore()({
  configurationReducers: { clusterNodes: false, clusterNodeSelected: false },
  // The manager branch renders the permissions-gated edit button.
  appStateReducers: {
    userPermissions: {},
    userAccount: { administrator_requirements: null },
    withUserLogged: true,
  },
});

const agent = { id: '001', name: 'agent.deb.local', status: 'active' };

const renderOverview = (props = {}) =>
  render(
    <Provider store={store}>
      <WzConfigurationOverview
        updateConfigurationSection={jest.fn()}
        {...props}
      />
    </Provider>,
  );

describe('WzConfigurationOverview', () => {
  it('says how long ago the agent reported', () => {
    renderOverview({
      agent,
      report: {
        content: {},
        modules: ['fim'],
        modifiedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
    });

    screen.getByText(/Reported 5 minutes ago/);
  });

  it('lists the modules of an agent', () => {
    renderOverview({ agent, report: { content: {}, modules: [] } });

    screen.getByText('Log collection');
  });

  /* The read can fail, and the modules stay reachable so each section can
  report what went wrong. There is nothing to date the configuration with. */
  it('lists the modules without a date when there is no report', () => {
    renderOverview({ agent });

    screen.getByText('Log collection');
    expect(screen.queryByText(/Reported/)).not.toBeInTheDocument();
  });

  it('says nothing about reporting for the manager', () => {
    renderOverview({});

    expect(screen.queryByText(/Reported/)).not.toBeInTheDocument();
  });
});

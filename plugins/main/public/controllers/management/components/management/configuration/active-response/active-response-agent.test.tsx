/*
 * See policy-monitoring-empty-states.test.tsx: the configuration comes from an
 * index document that only carries the modules the agent reported, so an
 * absent module is `undefined` rather than an empty section.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import WzConfigurationActiveResponseAgent from './active-response-agent';

jest.mock('../../../../../../kibana-services', () => ({
  getUiSettings: () => ({ get: () => false }),
}));

// The HOC pulls in the Server API client, which this view no longer uses.
jest.mock('../util-hocs/wz-config', () => () => Component => {
  const WithoutConfig = props => <Component {...props} />;
  return WithoutConfig;
});

const NOT_PRESENT = /not present on the configuration file/i;

const renderView = (
  currentConfig: Record<string, unknown>,
  wazuhNotReadyYet = false,
) => {
  const store = configureMockStore()({
    appStateReducers: { wazuhNotReadyYet },
  });
  return render(
    <Provider store={store}>
      <WzConfigurationActiveResponseAgent currentConfig={currentConfig} />
    </Provider>,
  );
};

describe('WzConfigurationActiveResponseAgent', () => {
  it('reports the module as not configured when it did not report', () => {
    renderView({});

    screen.getByText(NOT_PRESENT);
  });

  it('reports it as not configured when the report has no active response', () => {
    renderView({ execd: {} });

    screen.getByText(NOT_PRESENT);
  });

  it('renders the settings the agent reported', () => {
    renderView({ execd: { 'active-response': { disabled: 'no' } } });

    screen.getByText('Active response settings');
    expect(screen.queryByText(NOT_PRESENT)).not.toBeInTheDocument();
  });

  it('says the server is not ready rather than not configured', () => {
    renderView({}, true);

    expect(screen.queryByText(NOT_PRESENT)).not.toBeInTheDocument();
  });
});

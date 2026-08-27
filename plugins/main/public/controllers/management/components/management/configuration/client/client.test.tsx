/*
 * See active-response-agent.test.tsx: the configuration comes from an index
 * document that only carries the modules the agent reported, so an absent
 * module is `undefined` rather than an empty section.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import WzConfigurationClient from './client';

jest.mock('../../../../../../kibana-services', () => ({
  getUiSettings: () => ({ get: () => false }),
}));

// The HOC pulls in the Server API client, which this view no longer uses.
jest.mock('../util-hocs/wz-config', () => () => Component => {
  const WithoutConfig = props => <Component {...props} />;
  return WithoutConfig;
});

const NOT_PRESENT = /not present on the configuration file/i;
const EMPTY_MANAGER = /manager configuration is undefined or empty/i;

/* Each setting renders as a read-only input labelled by its own name, so a
value is asserted against the field that holds it rather than against the
document. */
const expectSetting = (testId: string, value: string) =>
  expect(screen.getByTestId(testId)).toHaveValue(value);

const renderView = (currentConfig: Record<string, unknown>) => {
  const store = configureMockStore()({
    appStateReducers: { wazuhNotReadyYet: false },
  });
  return render(
    <Provider store={store}>
      <WzConfigurationClient currentConfig={currentConfig} />
    </Provider>,
  );
};

const withEndpoint = (endpoint?: string) => ({
  agent: { agent: { manager: endpoint === undefined ? {} : { endpoint } } },
});

describe('WzConfigurationClient', () => {
  it('reports the module as not configured when the agent did not report it', () => {
    renderView({});

    screen.getByText(NOT_PRESENT);
  });

  it('renders the endpoint the agent reported', () => {
    renderView(withEndpoint('192.168.0.60:1517/wazuh-manager/'));

    screen.getByText('Server settings');
    expectSetting('endpoint', '192.168.0.60:1517/wazuh-manager/');
    expect(screen.queryByText(EMPTY_MANAGER)).not.toBeInTheDocument();
  });

  it('renders an endpoint that omits the port and the path prefix', () => {
    renderView(withEndpoint('192.168.0.60'));

    expectSetting('endpoint', '192.168.0.60');
  });

  it('renders an endpoint that omits only the path prefix', () => {
    renderView(withEndpoint('wazuh.manager:8443'));

    expectSetting('endpoint', 'wazuh.manager:8443');
  });

  it('warns when the agent reported no endpoint', () => {
    renderView(withEndpoint());

    screen.getByText(EMPTY_MANAGER);
  });

  it('warns when the reported endpoint is empty', () => {
    renderView(withEndpoint(''));

    screen.getByText(EMPTY_MANAGER);
  });
});

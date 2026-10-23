import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import WzConfigurationActiveResponseActiveResponse from './active-response-active-response';

jest.mock('react-redux', () => ({
  connect: () => Component => Component,
  __esModule: true,
}));

jest.mock('../../../../../../kibana-services', () => ({
  getUiSettings: () => ({ get: () => false }),
}));

describe('WzConfigurationActiveResponseActiveResponse', () => {
  it.each([
    { location: 'AS_ONLY', expected: 'server' },
    { location: 'REMOTE_AGENT', expected: 'local' },
    { location: 'SPECIFIC_AGENT', expected: 'defined-agent' },
    { location: 'ALL_AGENTS', expected: 'all' },
  ])(
    'renders the runtime location $location as $expected',
    ({ location, expected }) => {
      const currentConfig = {
        'analysis-active_response': {
          'active-response': [{ command: 'firewall-drop', location }],
        },
      };

      const { getByDisplayValue, queryByDisplayValue } = render(
        <WzConfigurationActiveResponseActiveResponse
          currentConfig={currentConfig}
        />,
      );

      expect(getByDisplayValue(expected)).toBeInTheDocument();
      expect(queryByDisplayValue(location)).not.toBeInTheDocument();
    },
  );

  it('renders the location of the selected active response', () => {
    const currentConfig = {
      'analysis-active_response': {
        'active-response': [
          { command: 'firewall-drop', location: 'REMOTE_AGENT' },
          { command: 'restart-wazuh', location: 'ALL_AGENTS' },
        ],
      },
    };

    const { getByDisplayValue, getByText } = render(
      <WzConfigurationActiveResponseActiveResponse
        currentConfig={currentConfig}
      />,
    );

    expect(getByDisplayValue('local')).toBeInTheDocument();

    fireEvent.click(getByText('restart-wazuh'));

    expect(getByDisplayValue('all')).toBeInTheDocument();
  });

  it('keeps an unknown location as is', () => {
    const currentConfig = {
      'analysis-active_response': {
        'active-response': [{ command: 'firewall-drop', location: 'custom' }],
      },
    };

    const { getByDisplayValue } = render(
      <WzConfigurationActiveResponseActiveResponse
        currentConfig={currentConfig}
      />,
    );

    expect(getByDisplayValue('custom')).toBeInTheDocument();
  });
});

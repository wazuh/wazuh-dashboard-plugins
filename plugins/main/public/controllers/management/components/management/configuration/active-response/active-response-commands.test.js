import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import WzConfigurationActiveResponseCommands from './active-response-commands';

jest.mock('react-redux', () => ({
  connect: () => Component => Component,
  __esModule: true,
}));

jest.mock('../../../../../../kibana-services', () => ({
  getUiSettings: () => ({ get: () => false }),
}));

describe('WzConfigurationActiveResponseCommands', () => {
  it('renders the numeric timeout_allowed as enabled or disabled', () => {
    const currentConfig = {
      'analysis-command': {
        command: [
          {
            name: 'firewall-drop',
            executable: 'firewall-drop',
            timeout_allowed: 1,
          },
          {
            name: 'restart-wazuh',
            executable: 'restart-wazuh',
            timeout_allowed: 0,
          },
        ],
      },
    };

    const { getByDisplayValue, getByText } = render(
      <WzConfigurationActiveResponseCommands currentConfig={currentConfig} />,
    );

    expect(getByDisplayValue('enabled')).toBeInTheDocument();

    fireEvent.click(getByText('restart-wazuh'));

    expect(getByDisplayValue('disabled')).toBeInTheDocument();
  });
});

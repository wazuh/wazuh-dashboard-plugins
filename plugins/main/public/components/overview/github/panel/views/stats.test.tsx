import React from 'react';
import { render } from '@testing-library/react';
import { ModuleConfiguration } from './stats';

const mockPanelModuleConfiguration = jest.fn(() => null);

jest.mock('../../../../common/modules/panel', () => ({
  PanelModuleConfiguration: props => mockPanelModuleConfiguration(props),
}));

describe('GitHub ModuleConfiguration', () => {
  it('renders the service status from the enabled field', () => {
    render(<ModuleConfiguration />);

    const { settings } = mockPanelModuleConfiguration.mock.calls[0][0];
    const { render: renderStatus } = settings.find(
      ({ field }) => field === 'enabled',
    );

    expect(renderStatus('yes')).toBe('enabled');
    expect(renderStatus('no')).toBe('disabled');
  });
});

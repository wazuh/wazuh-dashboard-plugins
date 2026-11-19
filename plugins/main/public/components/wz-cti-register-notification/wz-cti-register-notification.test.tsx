import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { WzCtiRegisterNotification } from '.';
import { getWazuhCheckUpdatesPlugin } from '../../kibana-services';

jest.mock('../../kibana-services', () => ({
  getWazuhCheckUpdatesPlugin: jest.fn(),
}));

const renderWith = (
  ctiRegistrationUiEnabled: boolean,
  ctiUpgradeEnabled: boolean,
) => {
  (getWazuhCheckUpdatesPlugin as jest.Mock).mockReturnValue({
    ctiRegistrationUiEnabled,
    ctiUpgradeEnabled,
    CtiRegisterNotification: () => <div>CTI upsell</div>,
  });
  render(<WzCtiRegisterNotification />);
};

describe('WzCtiRegisterNotification', () => {
  test('renders the upsell when the CTI UI and the upsell are enabled', () => {
    renderWith(true, true);
    expect(screen.getByText('CTI upsell')).toBeInTheDocument();
  });

  test('hides the upsell when the upsell is disabled', () => {
    renderWith(true, false);
    expect(screen.queryByText('CTI upsell')).not.toBeInTheDocument();
  });

  test('hides the upsell when the CTI registration UI is off', () => {
    renderWith(false, true);
    expect(screen.queryByText('CTI upsell')).not.toBeInTheDocument();
  });
});

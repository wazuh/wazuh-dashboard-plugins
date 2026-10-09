import React from 'react';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { WzCtiUpsellNotification } from '.';
import { renderWithProviders } from '../../redux/render-with-redux-provider';
import { getWazuhCheckUpdatesPlugin } from '../../kibana-services';

jest.mock('../../kibana-services', () => ({
  getWazuhCheckUpdatesPlugin: jest.fn(),
}));

const renderWith = (ctiRegistrationUiEnabled: boolean, data?: object) => {
  (getWazuhCheckUpdatesPlugin as jest.Mock).mockReturnValue({
    ctiRegistrationUiEnabled,
    CtiUpsellNotification: () => <div>CTI upsell</div>,
  });
  renderWithProviders(<WzCtiUpsellNotification />, {
    preloadedState: data ? { appConfig: { data } } : undefined,
  });
};

describe('WzCtiUpsellNotification', () => {
  test('renders the upsell when the setting does not hide it', () => {
    renderWith(true, { 'wazuh.cti.upsell.disabled': false });
    expect(screen.getByText('CTI upsell')).toBeInTheDocument();
  });

  test('hides the upsell when the admin disabled it', () => {
    renderWith(true, { 'wazuh.cti.upsell.disabled': true });
    expect(screen.queryByText('CTI upsell')).not.toBeInTheDocument();
  });

  test('hides the upsell while the configuration is not loaded', () => {
    renderWith(true);
    expect(screen.queryByText('CTI upsell')).not.toBeInTheDocument();
  });

  test('hides the upsell when the CTI registration UI is off', () => {
    renderWith(false, { 'wazuh.cti.upsell.disabled': false });
    expect(screen.queryByText('CTI upsell')).not.toBeInTheDocument();
  });
});

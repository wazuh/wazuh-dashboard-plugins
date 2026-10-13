import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { WzCtiUpsellNotification } from '.';
import { getWazuhCheckUpdatesPlugin } from '../../kibana-services';

jest.mock('../../kibana-services', () => ({
  getWazuhCheckUpdatesPlugin: jest.fn(),
}));

const renderWith = (
  ctiRegistrationUiEnabled: boolean,
  ctiUpsellEnabled: boolean,
) => {
  (getWazuhCheckUpdatesPlugin as jest.Mock).mockReturnValue({
    ctiRegistrationUiEnabled,
    ctiUpsellEnabled,
    CtiUpsellNotification: () => <div>CTI upsell</div>,
  });
  render(<WzCtiUpsellNotification />);
};

describe('WzCtiUpsellNotification', () => {
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

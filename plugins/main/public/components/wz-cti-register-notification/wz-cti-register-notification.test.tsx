import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { WzCtiRegisterNotification } from '.';
import { getWazuhCheckUpdatesPlugin } from '../../kibana-services';

jest.mock('../../kibana-services', () => ({
  getWazuhCheckUpdatesPlugin: jest.fn(),
}));

const renderWith = (ctiRegistrationUiEnabled: boolean) => {
  (getWazuhCheckUpdatesPlugin as jest.Mock).mockReturnValue({
    ctiRegistrationUiEnabled,
    CtiRegisterNotification: () => <div>CTI registration bar</div>,
  });
  render(<WzCtiRegisterNotification />);
};

describe('WzCtiRegisterNotification', () => {
  test('renders the registration bar when the CTI registration UI is enabled', () => {
    renderWith(true);
    expect(screen.getByText('CTI registration bar')).toBeInTheDocument();
  });

  test('hides the registration bar when the CTI registration UI is off', () => {
    renderWith(false);
    expect(screen.queryByText('CTI registration bar')).not.toBeInTheDocument();
  });
});

jest.mock('../../../plugin-services', () => ({
  getCore: jest.fn(),
  getWazuhCore: jest.fn().mockReturnValue({
    hooks: {
      useDockedSideNav: () => false,
    },
  }),
}));

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getCore } from '../../../plugin-services';
import { ctiFlowState } from '../../../services/cti-flow-state';
import { routes } from '../../../../common/constants';
import { CtiUpsellNotification } from './cti-upsell-notification';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_id: string, opts: { defaultMessage?: string }) =>
      opts.defaultMessage ?? '',
  },
  __esModule: true,
}));

jest.mock('@osd/i18n/react', () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  FormattedMessage: ({ defaultMessage }: { defaultMessage?: string }) => (
    <span>{defaultMessage ?? ''}</span>
  ),
  __esModule: true,
}));

const mockHttpGet = jest.fn();

const notRegisteredStatus = {
  registrationComplete: false,
  inProgress: false,
  subscription: {
    // eslint-disable-next-line camelcase -- CM API field names
    message: { plan: { name: '', is_public: true }, is_registered: false },
    status: 200,
  },
};

describe('CtiUpsellNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ctiFlowState.reset();
    try {
      localStorage.clear();
    } catch {
      // ignore
    }

    (getCore as jest.Mock).mockReturnValue({
      http: { get: mockHttpGet },
    });
  });

  test('does not show the upsell bar when the subscription status is unknown (502) but registration is complete', async () => {
    mockHttpGet.mockResolvedValue({
      registrationComplete: true,
      inProgress: false,
      subscription: { message: null, status: 502 },
    });

    render(<CtiUpsellNotification />);

    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalledWith(routes.ctiRegistrationStatus);
    });

    await waitFor(() => {
      expect(ctiFlowState.isRegistrationComplete()).toBe(true);
    });

    expect(screen.queryByText('Register now')).not.toBeInTheDocument();
  });

  test('shows the upsell bar when CM confirms the instance is not registered', async () => {
    mockHttpGet.mockResolvedValue(notRegisteredStatus);

    render(<CtiUpsellNotification />);

    expect(await screen.findByText('Register now')).toBeInTheDocument();
  });

  describe('when another CTI control changes the flow', () => {
    beforeEach(() => {
      mockHttpGet.mockResolvedValue(notRegisteredStatus);
    });

    test('hides while a device flow is in progress and shows again when it ends', async () => {
      render(<CtiUpsellNotification />);
      expect(await screen.findByText('Register now')).toBeInTheDocument();

      act(() => ctiFlowState.setDeviceCode('device-code'));
      expect(screen.queryByText('Register now')).not.toBeInTheDocument();

      act(() => ctiFlowState.reset());
      expect(screen.getByText('Register now')).toBeInTheDocument();
    });

    test('hides once registration completes', async () => {
      render(<CtiUpsellNotification />);
      expect(await screen.findByText('Register now')).toBeInTheDocument();

      act(() => ctiFlowState.setDeviceCode('device-code'));
      act(() => ctiFlowState.setRegistrationComplete(true));
      expect(screen.queryByText('Register now')).not.toBeInTheDocument();
    });
  });
});

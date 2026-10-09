jest.mock('../../../plugin-services', () => ({
  getCore: jest.fn(),
  getWazuhCore: jest.fn().mockReturnValue({
    hooks: {
      useDockedSideNav: () => false,
    },
  }),
}));

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getCore } from '../../../plugin-services';
import { ctiFlowState } from '../../../services/cti-flow-state';
import { ctiUpsellBarVisible$ } from '../../../services/cti-upsell-bar-state';
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
    expect(ctiUpsellBarVisible$.getValue()).toBe(false);
  });

  test('shows the upsell bar when CM confirms the instance is not registered', async () => {
    mockHttpGet.mockResolvedValue({
      registrationComplete: false,
      inProgress: false,
      subscription: {
        message: { plan: { name: '', is_public: true }, is_registered: false },
        status: 200,
      },
    });

    render(<CtiUpsellNotification />);

    expect(await screen.findByText('Register now')).toBeInTheDocument();
  });

  test('holds the bottom bar slot while shown and releases it on dismiss', async () => {
    mockHttpGet.mockResolvedValue({
      registrationComplete: false,
      inProgress: false,
      subscription: {
        message: { plan: { name: '', is_public: true }, is_registered: false },
        status: 200,
      },
    });

    render(<CtiUpsellNotification />);

    // Held while the status loads, so the updates bar never flashes first.
    expect(ctiUpsellBarVisible$.getValue()).toBe(true);
    fireEvent.click(await screen.findByText("Don't show again"));
    expect(ctiUpsellBarVisible$.getValue()).toBe(false);
  });

  test('releases the bottom bar slot on unmount', async () => {
    mockHttpGet.mockResolvedValue({
      registrationComplete: false,
      inProgress: false,
      subscription: {
        message: { plan: { name: '', is_public: true }, is_registered: false },
        status: 200,
      },
    });

    const { unmount } = render(<CtiUpsellNotification />);
    await screen.findByText('Register now');
    expect(ctiUpsellBarVisible$.getValue()).toBe(true);

    unmount();
    expect(ctiUpsellBarVisible$.getValue()).toBe(false);
  });
});

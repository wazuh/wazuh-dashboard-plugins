jest.mock('../../plugin-services', () => ({
  getCore: jest.fn(),
  getCtiRegistrationStatusPollIntervalSec: jest.fn(() => 30),
}));

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getCore } from '../../plugin-services';
import { ctiFlowState } from '../../services/cti-flow-state';
import { routes } from '../../../common/constants';
import { CtiRegistration } from './cti-registration';

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
  FormattedMessage: ({
    defaultMessage,
    values,
  }: {
    defaultMessage?: string;
    values?: Record<string, string>;
  }) => {
    let text = defaultMessage ?? '';
    if (values) {
      Object.entries(values).forEach(([key, value]) => {
        text = text.replace(`{${key}}`, value);
      });
    }
    return <span>{text}</span>;
  },
  __esModule: true,
}));

const mockUiSettingsGet = jest.fn();
const mockHttpGet = jest.fn();
const mockHttpPost = jest.fn();
const mockHttpDelete = jest.fn();

describe('CtiRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ctiFlowState.reset();

    mockHttpGet.mockResolvedValue({
      registrationComplete: false,
      inProgress: false,
      subscription: {
        message: {
          plan: { name: 'Premium Plan', is_public: true },
          is_registered: true,
        },
        status: 200,
      },
    });

    mockHttpPost.mockRejectedValue(
      new Error('poll should not run when registered'),
    );

    (getCore as jest.Mock).mockReturnValue({
      http: { get: mockHttpGet, post: mockHttpPost, delete: mockHttpDelete },
      uiSettings: { get: mockUiSettingsGet },
    });
  });

  test('does not render Register when status reports isRegistered (classic chrome)', async () => {
    mockUiSettingsGet.mockImplementation((key: string) =>
      key === 'home:useNewHomePage' ? false : undefined,
    );

    render(<CtiRegistration />);

    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalledWith(routes.ctiRegistrationStatus);
    });

    await waitFor(() => {
      expect(
        screen.queryByTestId('ctiRegistrationNavLoading'),
      ).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Register')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Wazuh XDR registration' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Wazuh Cloud - Premium Plan')).toBeInTheDocument();
    expect(mockHttpPost).not.toHaveBeenCalled();
    expect(ctiFlowState.isRegistered()).toBe(true);
  });

  test('does not render Register when status reports isRegistered (new homepage)', async () => {
    mockUiSettingsGet.mockImplementation((key: string) =>
      key === 'home:useNewHomePage' ? true : undefined,
    );

    render(<CtiRegistration />);

    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalledWith(routes.ctiRegistrationStatus);
    });

    await waitFor(() => {
      expect(
        screen.queryByTestId('ctiRegistrationNavLoading'),
      ).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Register')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Wazuh XDR registration' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'View available CTI registration status',
      }),
    ).toBeInTheDocument();
    expect(mockHttpPost).not.toHaveBeenCalled();
  });

  describe('pending activation', () => {
    const notRegistered = {
      registrationComplete: false,
      inProgress: false,
      subscription: { message: { is_registered: false }, status: 200 },
    };

    beforeEach(() => {
      mockHttpGet.mockResolvedValue({
        ...notRegistered,
        inProgress: true,
        device_code: 'dc-pending',
        user_code: 'WZH-PEND',
        verification_uri: 'https://example.test/act',
        poll_interval_sec: 5,
        expires_in_remaining_sec: 3575,
      });
      mockHttpPost.mockResolvedValue({ error: 'authorization_pending' });
      mockHttpDelete.mockResolvedValue({ success: true });
    });

    const openModal = async () => {
      render(<CtiRegistration />);
      const navButton = await screen.findByRole('button', {
        name: 'Wazuh Cloud activation pending. View activation details.',
      });
      fireEvent.click(navButton);
      return screen.findByRole('button', { name: 'Cancel' });
    };

    test('confirming the cancellation cancels the pending activation', async () => {
      const cancelButton = await openModal();
      mockHttpGet.mockResolvedValue(notRegistered);

      fireEvent.click(cancelButton);
      expect(mockHttpDelete).not.toHaveBeenCalled();
      fireEvent.click(
        screen.getByRole('button', { name: 'Cancel registration' }),
      );

      await waitFor(() => {
        expect(mockHttpDelete).toHaveBeenCalledWith(routes.token);
        expect(ctiFlowState.getDeviceCode()).toBeNull();
        expect(
          document.querySelector(
            '[data-test-subj="ctiStatusBackgroundSpinner"]',
          ),
        ).not.toBeInTheDocument();
      });
    });

    test('Escape asks for confirmation too', async () => {
      await openModal();
      mockHttpGet.mockResolvedValue(notRegistered);

      fireEvent.keyDown(document, { key: 'Escape' });
      fireEvent.click(
        await screen.findByRole('button', { name: 'Cancel registration' }),
      );

      await waitFor(() => {
        expect(mockHttpDelete).toHaveBeenCalledWith(routes.token);
        expect(ctiFlowState.getDeviceCode()).toBeNull();
      });
    });
  });

  test('closing the modal without a pending activation does not cancel anything', async () => {
    mockHttpGet.mockResolvedValue({
      registrationComplete: false,
      inProgress: false,
      subscription: { message: { is_registered: false }, status: 200 },
    });
    render(<CtiRegistration />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Wazuh XDR registration' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(mockHttpDelete).not.toHaveBeenCalled();
  });
});

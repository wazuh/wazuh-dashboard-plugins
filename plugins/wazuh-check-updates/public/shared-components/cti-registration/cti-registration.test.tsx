jest.mock('../../plugin-services', () => ({
  getCore: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
  I18nProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormattedMessage: ({
    defaultMessage,
  }: {
    defaultMessage?: string;
  }) => <span>{defaultMessage}</span>,
  __esModule: true,
}));

const mockUiSettingsGet = jest.fn();
const mockHttpGet = jest.fn();
const mockHttpPost = jest.fn();

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

    mockHttpPost.mockRejectedValue(new Error('poll should not run when registered'));

    (getCore as jest.Mock).mockReturnValue({
      http: { get: mockHttpGet, post: mockHttpPost },
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
      expect(screen.queryByTestId('ctiRegistrationNavLoading')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Register')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Register to CTI updates' })).not
      .toBeInTheDocument();
    expect(screen.getByText('CTI Status')).toBeInTheDocument();
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
      expect(screen.queryByTestId('ctiRegistrationNavLoading')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Register')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Register to CTI updates' })).not
      .toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'View available CTI registration status',
      }),
    ).toBeInTheDocument();
    expect(mockHttpPost).not.toHaveBeenCalled();
  });
});

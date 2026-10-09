jest.mock('../../../plugin-services', () => ({
  getCore: jest.fn(),
  getWazuhCore: jest.fn().mockReturnValue({
    hooks: {
      useDockedSideNav: () => false,
    },
  }),
}));

import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
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
const mockHttpPatch = jest.fn();

const NOT_REGISTERED_STATUS = {
  registrationComplete: false,
  inProgress: false,
  subscription: {
    message: { plan: { name: '', is_public: true }, is_registered: false },
    status: 200,
  },
};

const mockResponses = (ctiStatus: object, userPreferences: object = {}) => {
  mockHttpGet.mockImplementation((path: string) =>
    Promise.resolve(
      path === routes.userPreferences ? userPreferences : ctiStatus,
    ),
  );
};

describe('CtiUpsellNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ctiFlowState.reset();
    mockHttpPatch.mockResolvedValue({});

    (getCore as jest.Mock).mockReturnValue({
      http: { get: mockHttpGet, patch: mockHttpPatch },
    });
  });

  test('does not show the upsell bar when the subscription status is unknown (502) but registration is complete', async () => {
    mockResponses({
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
    mockResponses(NOT_REGISTERED_STATUS);

    render(<CtiUpsellNotification />);

    expect(await screen.findByText('Register now')).toBeInTheDocument();
  });

  test('does not show the upsell bar when the user dismissed it before', async () => {
    mockResponses(NOT_REGISTERED_STATUS, { hide_cti_upsell: true });

    render(<CtiUpsellNotification />);

    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalledWith(routes.userPreferences);
    });
    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalledWith(routes.ctiRegistrationStatus);
    });

    expect(screen.queryByText('Register now')).not.toBeInTheDocument();
  });

  test('stores the dismissal in the user preferences', async () => {
    mockResponses(NOT_REGISTERED_STATUS);

    render(<CtiUpsellNotification />);

    fireEvent.click(await screen.findByText("Don't show again"));

    expect(screen.queryByText('Register now')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(mockHttpPatch).toHaveBeenCalledWith(routes.userPreferences, {
        body: JSON.stringify({ hide_cti_upsell: true }),
      });
    });
    await act(() => mockHttpPatch.mock.results[0].value);
  });
});

jest.mock('../../../plugin-services', () => ({
  getCore: jest.fn(),
}));

jest.mock('../../../services/cti-registration-permission', () => ({
  fetchCtiRegistrationPermission: jest.fn(),
}));

import React from 'react';
import {
  render,
  fireEvent,
  act,
  waitFor,
  screen,
  cleanup,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { getCore } from '../../../plugin-services';
import { ctiFlowState } from '../../../services/cti-flow-state';
import {
  CTI_DEFAULT_DEVICE_CODE_EXPIRES_IN_SEC,
  CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC,
  statusCodes,
} from '../../../../common/constants';
import { fetchCtiRegistrationPermission } from '../../../services/cti-registration-permission';
import { ModalCti } from './modal-cti';
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_id: string, opts: { defaultMessage?: string }) =>
      opts.defaultMessage ?? '',
  },
  __esModule: true,
}));

jest.mock('@osd/i18n/react', () => ({
  FormattedMessage: ({ defaultMessage }: { defaultMessage?: string }) => (
    <span>{defaultMessage}</span>
  ),
  __esModule: true,
}));

const handleModalToggleMock = jest.fn();

const mockHttpPost = jest.fn();
const mockHttpGet = jest.fn();
const mockRefetchStatus = jest.fn().mockResolvedValue(undefined);

const defaultStatusCti = { status: 404, message: '' };

const mockedFetchCtiRegistrationPermission =
  fetchCtiRegistrationPermission as jest.Mock;

const MISSING_PRIVILEGE = 'cluster:admin/content_manager/subscription/create';

describe('ModalCti component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetchStatus.mockReset();
    mockRefetchStatus.mockResolvedValue(undefined);
    ctiFlowState.reset();
    ctiFlowState.setSubscription(null);
    mockHttpGet.mockResolvedValue({ data: [] });
    mockedFetchCtiRegistrationPermission.mockResolvedValue({
      accessAllowed: true,
      missingPrivileges: [],
    });
    (getCore as jest.Mock).mockReturnValue({
      http: { post: mockHttpPost, get: mockHttpGet },
    });
    /* eslint-disable camelcase -- OAuth device authorization JSON uses snake_case */
    mockHttpPost.mockResolvedValue({
      device_code: 'mock_device_code_123',
      user_code: 'WZH-999',
      verification_uri: 'https://example.test/platform/environments/register',
      verification_uri_complete:
        'https://example.test/platform/environments/register?user_code=WZH-999',
      interval: CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC,
      expires_in: CTI_DEFAULT_DEVICE_CODE_EXPIRES_IN_SEC,
    });
    /* eslint-enable camelcase */
    Object.defineProperty(window, 'open', {
      writable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('should render correctly', async () => {
    render(
      <ModalCti
        handleModalToggle={handleModalToggleMock}
        statusCTI={defaultStatusCti}
        refetchStatus={mockRefetchStatus}
      />,
    );
    expect(
      await screen.findByText('Wazuh XDR registration'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Register' }),
    ).toBeInTheDocument();
  });

  it('renders the Consumers accordion in the success view', async () => {
    render(
      <ModalCti
        handleModalToggle={handleModalToggleMock}
        statusCTI={{ status: statusCodes.SUCCESS, message: '' }}
        refetchStatus={mockRefetchStatus}
      />,
    );

    expect(
      await screen.findByRole('button', { name: 'Consumers' }),
    ).toBeInTheDocument();
  });

  it('reopens to in-progress links when refetch restores server snapshot', async () => {
    mockRefetchStatus.mockImplementation(async () => {
      ctiFlowState.setRegistrationComplete(false);
      ctiFlowState.setDeviceCode('dc-restored');
      ctiFlowState.setDeviceAuthLinks({
        user_code: 'WZH-REST',
        verification_uri: 'https://example.test/act',
        verification_uri_complete:
          'https://example.test/act?user_code=WZH-REST',
      });
    });

    const { queryByText } = render(
      <ModalCti
        handleModalToggle={handleModalToggleMock}
        statusCTI={defaultStatusCti}
        refetchStatus={mockRefetchStatus}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText('Complete activation in Wazuh Cloud'),
      ).toBeInTheDocument();
      expect(
        document.querySelector('[data-test-subj="ctiModalDeviceFlowSubtitle"]'),
      ).toBeInTheDocument();
      expect(
        document.querySelector('[data-test-subj="ctiDeviceUserCode"]'),
      ).toHaveTextContent('WZH-REST');
    });
    expect(
      queryByText('Complete activation in Wazuh Cloud'),
    ).toBeInTheDocument();
  });

  it('should handle button click, show activation URL, and open verification URI', async () => {
    render(
      <ModalCti
        handleModalToggle={handleModalToggleMock}
        statusCTI={defaultStatusCti}
        refetchStatus={mockRefetchStatus}
      />,
    );
    const button = await screen.findByRole('button', { name: 'Register' });
    act(() => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockHttpPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({}),
        }),
      );
      expect(ctiFlowState.getDeviceCode()).toBe('mock_device_code_123');
      expect(
        document.querySelector('[data-test-subj="ctiDeviceVerificationLink"]'),
      ).toHaveAttribute(
        'href',
        'https://example.test/platform/environments/register?user_code=WZH-999',
      );
    });
    expect(screen.getByText('WZH-999')).toBeInTheDocument();
    expect(window.open).toHaveBeenCalledWith(
      'https://example.test/platform/environments/register?user_code=WZH-999',
      'wazuh_cti',
    );
    expect(ctiFlowState.getDeviceAuthLinks()?.verification_uri_complete).toBe(
      'https://example.test/platform/environments/register?user_code=WZH-999',
    );
  });

  it('starts device flow polling schedule and shows in-progress copy', async () => {
    const onDeviceFlowStarted = jest.fn();
    render(
      <ModalCti
        handleModalToggle={handleModalToggleMock}
        statusCTI={defaultStatusCti}
        refetchStatus={mockRefetchStatus}
        onDeviceFlowStarted={onDeviceFlowStarted}
      />,
    );
    const registerBtn = await screen.findByRole('button', { name: 'Register' });
    act(() => {
      fireEvent.click(registerBtn);
    });
    await waitFor(() => {
      expect(onDeviceFlowStarted).toHaveBeenCalled();
      expect(ctiFlowState.getPollIntervalSec()).toBe(
        CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC,
      );
      expect(ctiFlowState.getDeviceAuthLinks()?.user_code).toBe('WZH-999');
      expect(
        document.querySelector('[data-test-subj="ctiRegistrationInProgress"]'),
      ).toBeInTheDocument();
    });
  });

  describe('registration permission', () => {
    it('probes the permission when the environment is not registered', async () => {
      render(
        <ModalCti
          handleModalToggle={handleModalToggleMock}
          statusCTI={defaultStatusCti}
          refetchStatus={mockRefetchStatus}
        />,
      );

      expect(
        await screen.findByRole('button', { name: 'Register' }),
      ).toBeInTheDocument();
      expect(mockedFetchCtiRegistrationPermission).toHaveBeenCalledTimes(1);
    });

    it('does not probe when the environment is already registered', async () => {
      render(
        <ModalCti
          handleModalToggle={handleModalToggleMock}
          statusCTI={{ status: statusCodes.SUCCESS, message: '' }}
          refetchStatus={mockRefetchStatus}
        />,
      );

      expect(
        await screen.findByRole('button', { name: 'Consumers' }),
      ).toBeInTheDocument();
      expect(mockedFetchCtiRegistrationPermission).not.toHaveBeenCalled();
    });

    it('warns instead of offering to register when the user is denied', async () => {
      mockedFetchCtiRegistrationPermission.mockResolvedValue({
        accessAllowed: false,
        missingPrivileges: [],
      });

      render(
        <ModalCti
          handleModalToggle={handleModalToggleMock}
          statusCTI={defaultStatusCti}
          refetchStatus={mockRefetchStatus}
        />,
      );

      await waitFor(() => {
        expect(
          document.querySelector(
            '[data-test-subj="ctiRegistrationPermissionDenied"]',
          ),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByText('You cannot register this environment'),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Register' }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('drops the registration invitation when the user is denied', async () => {
      mockedFetchCtiRegistrationPermission.mockResolvedValue({
        accessAllowed: false,
        missingPrivileges: [],
      });

      render(
        <ModalCti
          handleModalToggle={handleModalToggleMock}
          statusCTI={defaultStatusCti}
          refetchStatus={mockRefetchStatus}
        />,
      );

      await waitFor(() => {
        expect(
          document.querySelector(
            '[data-test-subj="ctiRegistrationPermissionDenied"]',
          ),
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByText(/Register your Wazuh XDR to receive/),
      ).not.toBeInTheDocument();
    });

    it('lists the missing privileges reported by the indexer', async () => {
      mockedFetchCtiRegistrationPermission.mockResolvedValue({
        accessAllowed: false,
        missingPrivileges: [MISSING_PRIVILEGE],
      });

      render(
        <ModalCti
          handleModalToggle={handleModalToggleMock}
          statusCTI={defaultStatusCti}
          refetchStatus={mockRefetchStatus}
        />,
      );

      expect(await screen.findByText(MISSING_PRIVILEGE)).toBeInTheDocument();
      expect(screen.getByText('Missing privileges:')).toBeInTheDocument();
    });

    it('offers no action either way while the probe is in flight', async () => {
      let resolveProbe!: (value: unknown) => void;
      mockedFetchCtiRegistrationPermission.mockReturnValue(
        new Promise(resolve => {
          resolveProbe = resolve;
        }),
      );

      render(
        <ModalCti
          handleModalToggle={handleModalToggleMock}
          statusCTI={defaultStatusCti}
          refetchStatus={mockRefetchStatus}
        />,
      );

      await waitFor(() => {
        expect(
          document.querySelector('[data-test-subj="ctiModalSyncSpinner"]'),
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByRole('button', { name: 'Register' }),
      ).not.toBeInTheDocument();
      expect(
        document.querySelector(
          '[data-test-subj="ctiRegistrationPermissionDenied"]',
        ),
      ).not.toBeInTheDocument();

      await act(async () => {
        resolveProbe({ accessAllowed: true, missingPrivileges: [] });
        await Promise.resolve();
      });

      expect(
        await screen.findByRole('button', { name: 'Register' }),
      ).toBeInTheDocument();
    });

    it('keeps the Register action when the probe cannot be evaluated', async () => {
      mockedFetchCtiRegistrationPermission.mockResolvedValue({
        accessAllowed: true,
        missingPrivileges: [],
      });

      render(
        <ModalCti
          handleModalToggle={handleModalToggleMock}
          statusCTI={defaultStatusCti}
          refetchStatus={mockRefetchStatus}
        />,
      );

      expect(
        await screen.findByRole('button', { name: 'Register' }),
      ).toBeInTheDocument();
      expect(
        document.querySelector(
          '[data-test-subj="ctiRegistrationPermissionDenied"]',
        ),
      ).not.toBeInTheDocument();
    });
  });
});

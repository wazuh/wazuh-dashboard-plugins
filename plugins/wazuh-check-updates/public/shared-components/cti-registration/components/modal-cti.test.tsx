jest.mock('../../../plugin-services', () => ({
  getCore: jest.fn(),
}));

import React from 'react';
import { render, fireEvent, act, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getCore } from '../../../plugin-services';
import { ctiFlowState } from '../../../services/cti-flow-state';
import {
  CTI_DEFAULT_DEVICE_CODE_EXPIRES_IN_SEC,
  CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC,
} from '../../../../common/constants';
import { ModalCti } from './modal-cti';
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_id: string, opts: { defaultMessage?: string }) =>
      opts.defaultMessage ?? '',
  },
  __esModule: true,
}));

jest.mock('@osd/i18n/react', () => ({
  FormattedMessage: ({
    defaultMessage,
  }: {
    defaultMessage?: string;
  }) => <span>{defaultMessage}</span>,
  __esModule: true,
}));

const handleModalToggleMock = jest.fn();

const mockHttpPost = jest.fn();
const mockRefetchStatus = jest.fn().mockResolvedValue(undefined);

const defaultStatusCti = { status: 404, message: '' };

describe('ModalCti component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetchStatus.mockReset();
    mockRefetchStatus.mockResolvedValue(undefined);
    ctiFlowState.reset();
    ctiFlowState.setSubscription(null);
    (getCore as jest.Mock).mockReturnValue({
      http: { post: mockHttpPost },
    });
    /* eslint-disable camelcase -- OAuth device authorization JSON uses snake_case */
    mockHttpPost.mockResolvedValue({
      device_code: 'mock_device_code_123',
      user_code: 'WZH-999',
      verification_uri:
        'https://console.wazuh.com/platform/environments/register',
      verification_uri_complete:
        'https://console.wazuh.com/platform/environments/register?user_code=WZH-999',
      interval: CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC,
      expires_in: CTI_DEFAULT_DEVICE_CODE_EXPIRES_IN_SEC,
    });
    /* eslint-enable camelcase */
    Object.defineProperty(window, 'open', {
      writable: true,
      value: jest.fn(),
    });
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
      await screen.findByText('Do you want to register to CTI updates?'),
    ).toBeInTheDocument();
    expect(screen.getByText('Yes, I want to register')).toBeInTheDocument();
  });

  it('reopens to in-progress links when refetch restores server snapshot', async () => {
    mockRefetchStatus.mockImplementation(async () => {
      ctiFlowState.setRegistrationComplete(false);
      ctiFlowState.setDeviceCode('dc-restored');
      ctiFlowState.setDeviceAuthLinks({
        user_code: 'WZH-REST',
        verification_uri: 'https://console.wazuh.com/act',
        verification_uri_complete:
          'https://console.wazuh.com/act?user_code=WZH-REST',
      });
    });

    const { queryByText, getByTestId } = render(
      <ModalCti
        handleModalToggle={handleModalToggleMock}
        statusCTI={defaultStatusCti}
        refetchStatus={mockRefetchStatus}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText('Complete activation in CTI Console'),
      ).toBeInTheDocument();
      expect(getByTestId('ctiModalDeviceFlowSubtitle')).toBeInTheDocument();
      expect(getByTestId('ctiDeviceUserCode')).toHaveTextContent('WZH-REST');
    });
    expect(
      queryByText('Do you want to register to CTI updates?'),
    ).not.toBeInTheDocument();
  });

  it('should handle button click, show activation URL, and open verification URI', async () => {
    render(
      <ModalCti
        handleModalToggle={handleModalToggleMock}
        statusCTI={defaultStatusCti}
        refetchStatus={mockRefetchStatus}
      />,
    );
    const button = await screen.findByText('Yes, I want to register');
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
      expect(screen.getByTestId('ctiDeviceVerificationLink')).toHaveAttribute(
        'href',
        'https://console.wazuh.com/platform/environments/register?user_code=WZH-999',
      );
    });
    expect(screen.getByText('WZH-999')).toBeInTheDocument();
    expect(window.open).toHaveBeenCalledWith(
      'https://console.wazuh.com/platform/environments/register?user_code=WZH-999',
      'wazuh_cti',
    );
    expect(ctiFlowState.getDeviceAuthLinks()?.verification_uri_complete).toBe(
      'https://console.wazuh.com/platform/environments/register?user_code=WZH-999',
    );
  });

  it('starts device flow polling schedule and shows in-progress copy', async () => {
    const onDeviceFlowStarted = jest.fn();
    const { getByTestId } = render(
      <ModalCti
        handleModalToggle={handleModalToggleMock}
        statusCTI={defaultStatusCti}
        refetchStatus={mockRefetchStatus}
        onDeviceFlowStarted={onDeviceFlowStarted}
      />,
    );
    const registerBtn = await screen.findByText('Yes, I want to register');
    act(() => {
      fireEvent.click(registerBtn);
    });
    await waitFor(() => {
      expect(onDeviceFlowStarted).toHaveBeenCalled();
      expect(ctiFlowState.getPollIntervalSec()).toBe(
        CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC,
      );
      expect(ctiFlowState.getDeviceAuthLinks()?.user_code).toBe('WZH-999');
      expect(getByTestId('ctiRegistrationInProgress')).toBeInTheDocument();
    });
  });
});

jest.mock('../../../plugin-services', () => ({
  getCore: jest.fn(),
}));

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getCore } from '../../../plugin-services';
import { ctiFlowState } from '../../../services/cti-flow-state';
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
    ctiFlowState.reset();
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
    });
    /* eslint-enable camelcase */
    Object.defineProperty(window, 'open', {
      writable: true,
      value: jest.fn(),
    });
  });

  it('should render correctly', () => {
    const { getByText } = render(
      <ModalCti
        handleModalToggle={handleModalToggleMock}
        statusCTI={defaultStatusCti}
        refetchStatus={mockRefetchStatus}
      />,
    );
    expect(
      getByText('Do you want to register to CTI updates?'),
    ).toBeInTheDocument();
    expect(getByText('Yes, I want to register')).toBeInTheDocument();
  });

  it('should handle button click, show activation URL, and open verification URI', async () => {
    const { getByText } = render(
      <ModalCti
        handleModalToggle={handleModalToggleMock}
        statusCTI={defaultStatusCti}
        refetchStatus={mockRefetchStatus}
      />,
    );
    const button = getByText('Yes, I want to register');
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
        getByText(
          /https:\/\/console\.wazuh\.com\/platform\/environments\/register\?user_code=WZH-999/,
        ),
      ).toBeInTheDocument();
    });
    expect(getByText('WZH-999')).toBeInTheDocument();
    expect(window.open).toHaveBeenCalledWith(
      'https://console.wazuh.com/platform/environments/register?user_code=WZH-999',
      'wazuh_cti',
    );
  });
});

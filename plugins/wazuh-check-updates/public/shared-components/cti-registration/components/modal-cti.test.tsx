jest.mock('../../../plugin-services', () => ({
  getCore: jest.fn(),
}));

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getCore } from '../../../plugin-services';
import { ModalCti } from './modal-cti';

// Mock @osd/i18n to handle FormattedMessage components
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
const handleStatusModalToggleMock = jest.fn();

const mockHttpPost = jest.fn();

describe('ModalCti component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCore as jest.Mock).mockReturnValue({
      http: { post: mockHttpPost },
    });
    /* eslint-disable camelcase -- OAuth device authorization JSON uses snake_case */
    mockHttpPost.mockResolvedValue({
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
        handleStatusModalToggle={handleStatusModalToggleMock}
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
        handleStatusModalToggle={handleStatusModalToggleMock}
      />,
    );
    const button = getByText('Yes, I want to register');
    act(() => {
      fireEvent.click(button);
    });

    await waitFor(() => {
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

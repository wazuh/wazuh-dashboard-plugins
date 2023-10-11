import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ApisUpdateStatus } from '.';
import { useAvailableUpdates } from '../../hooks';
import { API_UPDATES_STATUS } from '../../../common/types';
import userEvent from '@testing-library/user-event';

jest.mock('../dismiss-notification-check', () => ({
  DismissNotificationCheck: jest
    .fn()
    .mockReturnValue(<div>Dismiss Notification Check component</div>),
}));

jest.mock('./table', () => ({
  ApisUpdateTable: jest
    .fn()
    .mockReturnValue(<div>APIs Updates Table component</div>),
}));

jest.mock('../../../../plugin-services', () => ({
  getWazuhCore: jest
    .fn()
    .mockReturnValue({
      utils: {
        formatUIDate: jest.fn().mockReturnValue('2023-09-18T14:00:00.000Z'),
      },
    }),
}));

const mockedUseAvailabeUpdates = useAvailableUpdates as jest.Mock;
jest.mock('../../hooks/available-updates');

describe('UpdatesNotification component', () => {
  test('should return the ApisUpdateStatus component', () => {
    mockedUseAvailabeUpdates.mockImplementation(() => ({
      isLoading: false,
      apisAvailableUpdates: [
        {
          api_id: 'api id',
          current_version: '4.3.1',
          status: 'availableUpdates' as API_UPDATES_STATUS,
          last_available_patch: {
            description:
              '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
            published_date: '2022-05-18T10:12:43Z',
            semver: {
              major: 4,
              minor: 3,
              patch: 8,
            },
            tag: 'v4.3.8',
            title: 'Wazuh v4.3.8',
          },
        },
      ],
      lastCheck: '2023-09-18T14:00:00.000Z',
      refreshAvailableUpdates: jest.fn().mockResolvedValue({}),
    }));

    const { container, getByText } = render(
      <ApisUpdateStatus setApisAvailableUpdates={() => {}} />,
    );

    expect(container).toMatchSnapshot();

    const dismissNotificationCheck = getByText(
      'Dismiss Notification Check component',
    );
    expect(dismissNotificationCheck).toBeInTheDocument();

    const apisUpdateTable = getByText('APIs Updates Table component');
    expect(apisUpdateTable).toBeInTheDocument();

    const lastCheck = getByText('2023-09-18T14:00:00.000Z');
    expect(lastCheck).toBeInTheDocument();
  });

  test('should retrieve available updates when click the button', async () => {
    mockedUseAvailabeUpdates.mockImplementation(() => ({
      isLoading: false,
      apisAvailableUpdates: [
        {
          api_id: 'api id',
          current_version: '4.3.1',
          status: 'availableUpdates' as API_UPDATES_STATUS,
          last_available_patch: {
            description:
              '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
            published_date: '2022-05-18T10:12:43Z',
            semver: {
              major: 4,
              minor: 3,
              patch: 8,
            },
            tag: 'v4.3.8',
            title: 'Wazuh v4.3.8',
          },
        },
      ],
      lastCheck: '2023-09-18T14:00:00.000Z',
      refreshAvailableUpdates: jest.fn().mockResolvedValue({}),
    }));

    const { container, getByRole, getByText } = render(
      <ApisUpdateStatus setApisAvailableUpdates={() => {}} />,
    );

    expect(container).toMatchSnapshot();

    const checkUpdatesButton = getByRole('button', { name: 'Check updates' });
    expect(checkUpdatesButton).toBeInTheDocument();
    await userEvent.click(checkUpdatesButton);
    waitFor(async () => {
      const apisUpdateTable = getByText('APIs Updates Table component');
      expect(apisUpdateTable).toBeInTheDocument();

      const lastCheck = getByText('2023-09-18T14:00:00.000Z');
      expect(lastCheck).toBeInTheDocument();
    });
  });
});

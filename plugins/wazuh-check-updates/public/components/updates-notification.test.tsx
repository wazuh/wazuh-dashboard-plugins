import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAvailableUpdates, useUserPreferences } from '../hooks';
import { areThereNewUpdates } from '../utils';
import { UpdatesNotification } from './updates-notification';
import userEvent from '@testing-library/user-event';
import { API_UPDATES_STATUS } from '../../common/types';

jest.mock(
  '../../../../node_modules/@elastic/eui/lib/services/accessibility/html_id_generator',
  () => ({
    htmlIdGenerator: () => () => 'htmlId',
  })
);

jest.mock('../plugin-services', () => ({
  getCore: jest.fn().mockReturnValue({
    http: {
      basePath: {
        prepend: () => 'http://url',
      },
    },
  }),
}));

const mockedUseAvailabeUpdates = useAvailableUpdates as jest.Mock;
jest.mock('../hooks/available-updates');

const mockedUseUserPreferences = useUserPreferences as jest.Mock;
jest.mock('../hooks/user-preferences');

const mockedAreThereNewUpdates = areThereNewUpdates as jest.Mock;
jest.mock('../utils/are-there-new-updates');

describe('UpdatesNotification component', () => {
  test('should return the nofication component', () => {
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
    }));
    mockedUseUserPreferences.mockImplementation(() => ({
      isLoading: false,
      userPreferences: {
        last_dismissed_updates: [
          {
            api_id: 'api id',
            last_patch: 'v4.3.1',
          },
        ],
        hide_update_notifications: false,
      },
    }));
    mockedAreThereNewUpdates.mockImplementation(() => true);

    const { container, getByText, getByRole } = render(<UpdatesNotification />);

    expect(container).toMatchSnapshot();

    const message = getByText('Wazuh new release is available!');
    expect(message).toBeInTheDocument();

    const releaseNotesLink = getByRole('link', { name: 'Go to the about page for details' });
    expect(releaseNotesLink).toBeInTheDocument();

    const dismissCheck = getByText('Disable updates notifications');
    expect(dismissCheck).toBeInTheDocument();

    const checkUpdatesButton = getByRole('button', { name: 'Close' });
    expect(checkUpdatesButton).toBeInTheDocument();
  });

  test('should return null when user close notification', async () => {
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
    }));
    mockedUseUserPreferences.mockImplementation(() => ({
      isLoading: false,
      userPreferences: {
        last_dismissed_updates: [
          {
            api_id: 'api id',
            last_patch: 'v4.3.1',
          },
        ],
        hide_update_notifications: false,
      },
      updateUserPreferences: () => {},
    }));
    mockedAreThereNewUpdates.mockImplementation(() => true);

    const { container, getByRole } = render(<UpdatesNotification />);

    const closeButton = getByRole('button', { name: 'Close' });
    expect(closeButton).toBeInTheDocument();
    await userEvent.click(closeButton);

    expect(container).toMatchSnapshot();

    const firstChild = container.firstChild;
    expect(firstChild).toBeNull();
  });

  test('should return null when is loading', () => {
    mockedUseAvailabeUpdates.mockImplementation(() => ({ isLoading: true }));
    mockedUseUserPreferences.mockImplementation(() => ({
      isLoading: true,
    }));
    mockedAreThereNewUpdates.mockImplementation(() => undefined);

    const { container } = render(<UpdatesNotification />);

    expect(container).toMatchSnapshot();

    const firstChild = container.firstChild;
    expect(firstChild).toBeNull();
  });

  test('should return null when there are no available updates', () => {
    mockedUseAvailabeUpdates.mockImplementation(() => ({ isLoading: false }));
    mockedUseUserPreferences.mockImplementation(() => ({
      isLoading: false,
      userPreferences: { hide_update_notifications: false },
    }));
    mockedAreThereNewUpdates.mockImplementation(() => undefined);

    const { container } = render(<UpdatesNotification />);

    expect(container).toMatchSnapshot();

    const firstChild = container.firstChild;
    expect(firstChild).toBeNull();
  });

  test('should return null when user dismissed notifications for future', () => {
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
    }));
    mockedUseUserPreferences.mockImplementation(() => ({
      isLoading: false,
      userPreferences: {
        last_dismissed_updates: [
          {
            api_id: 'api id',
            last_patch: 'v4.3.1',
          },
        ],
        hide_update_notifications: true,
      },
    }));
    mockedAreThereNewUpdates.mockImplementation(() => true);

    const { container } = render(<UpdatesNotification />);

    expect(container).toMatchSnapshot();

    const firstChild = container.firstChild;
    expect(firstChild).toBeNull();
  });

  test('should return null when user already dismissed the notifications for available updates', () => {
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
    }));
    mockedUseUserPreferences.mockImplementation(() => ({
      isLoading: false,
      userPreferences: {
        last_dismissed_updates: [
          {
            api_id: 'api id',
            last_patch: 'v4.3.8',
          },
        ],
        hide_update_notifications: false,
      },
    }));
    mockedAreThereNewUpdates.mockImplementation(() => false);

    const { container } = render(<UpdatesNotification />);

    expect(container).toMatchSnapshot();

    const firstChild = container.firstChild;
    expect(firstChild).toBeNull();
  });
});

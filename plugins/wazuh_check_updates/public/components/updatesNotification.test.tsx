import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TestProviders } from '../test/test-utils';
import { useAvailableUpdates, useUserPreferences } from '../hooks';
import { getCurrentAvailableUpdate } from '../utils';
import { UpdatesNotification } from './updatesNotification';
import userEvent from '@testing-library/user-event';

const mockedUseAvailabeUpdates = useAvailableUpdates as jest.Mock;
jest.mock('../hooks/useAvailableUpdates');

const mockedUseUserPreferences = useUserPreferences as jest.Mock;
jest.mock('../hooks/useUserPreferences');

const mockedGetCurrentAvailableUpdate = getCurrentAvailableUpdate as jest.Mock;
jest.mock('../utils/getCurrentAvailableUpdate');

describe('UpdatesNotification component', () => {
  test('should return the nofication component', () => {
    mockedUseAvailabeUpdates.mockImplementation(() => ({
      isLoading: false,
      availableUpdates: {
        last_check: '2021-09-30T14:00:00.000Z',
        mayor: [
          {
            title: 'Wazuh 4.2.6',
            description:
              'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
            published_date: '2021-09-30T14:00:00.000Z',
            semver: {
              mayor: 4,
              minor: 2,
              patch: 6,
            },
            tag: 'v4.2.6',
          },
        ],
        minor: [],
        patch: [],
      },
    }));
    mockedUseUserPreferences.mockImplementation(() => ({
      isLoading: false,
      userPreferences: { hide_update_notifications: false, last_dismissed_update: 'v4.2.1' },
    }));
    mockedGetCurrentAvailableUpdate.mockImplementation(() => ({
      title: 'Wazuh 4.2.6',
      description:
        'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
      published_date: '2021-09-30T14:00:00.000Z',
      semver: {
        mayor: 4,
        minor: 2,
        patch: 6,
      },
      tag: 'v4.2.6',
    }));

    const { container, getByText, getByRole } = render(
      <TestProviders>
        <UpdatesNotification />
      </TestProviders>
    );

    expect(container).toMatchSnapshot();

    const message = getByText('¡Wazuh new release is available now!');
    expect(message).toBeInTheDocument();

    const elementWithTag = getByText('v4.2.6');
    expect(elementWithTag).toBeInTheDocument();

    const releaseNotesUrl = 'https://documentation.wazuh.com/4.2/release-notes/release-4-2-6.html';
    const releaseNotesLink = getByRole('link', { name: 'Go to the release notes for details' });
    expect(releaseNotesLink).toHaveAttribute('href', releaseNotesUrl);

    const dismissCheck = getByText("I don't want to know about future releases");
    expect(dismissCheck).toBeInTheDocument();

    const checkUpdatesButton = getByRole('button', { name: 'Close' });
    expect(checkUpdatesButton).toBeInTheDocument();
  });

  test('should return null when user close notification', async () => {
    mockedUseAvailabeUpdates.mockImplementation(() => ({
      isLoading: false,
      availableUpdates: {
        last_check: '2021-09-30T14:00:00.000Z',
        mayor: [
          {
            title: 'Wazuh 4.2.6',
            description:
              'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
            published_date: '2021-09-30T14:00:00.000Z',
            semver: {
              mayor: 4,
              minor: 2,
              patch: 6,
            },
            tag: 'v4.2.6',
          },
        ],
        minor: [],
        patch: [],
      },
    }));
    mockedUseUserPreferences.mockImplementation(() => ({
      isLoading: false,
      userPreferences: { hide_update_notifications: false, last_dismissed_update: 'v4.2.1' },
      updateUserPreferences: () => {},
    }));
    mockedGetCurrentAvailableUpdate.mockImplementation(() => ({
      title: 'Wazuh 4.2.6',
      description:
        'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
      published_date: '2021-09-30T14:00:00.000Z',
      semver: {
        mayor: 4,
        minor: 2,
        patch: 6,
      },
      tag: 'v4.2.6',
    }));

    const { container, getByRole } = render(
      <TestProviders>
        <UpdatesNotification />
      </TestProviders>
    );

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
      userPreferences: { hide_update_notifications: false, last_dismissed_update: 'v4.2.1' },
    }));
    mockedGetCurrentAvailableUpdate.mockImplementation(() => undefined);

    const { container } = render(
      <TestProviders>
        <UpdatesNotification />
      </TestProviders>
    );

    expect(container).toMatchSnapshot();

    const firstChild = container.firstChild;
    expect(firstChild).toBeNull();
  });

  test('should return null when there are no available updates', () => {
    mockedUseAvailabeUpdates.mockImplementation(() => ({ isLoading: false }));
    mockedUseUserPreferences.mockImplementation(() => ({
      isLoading: false,
      userPreferences: { hide_update_notifications: false, last_dismissed_update: 'v4.2.1' },
    }));
    mockedGetCurrentAvailableUpdate.mockImplementation(() => undefined);

    const { container } = render(
      <TestProviders>
        <UpdatesNotification />
      </TestProviders>
    );

    expect(container).toMatchSnapshot();

    const firstChild = container.firstChild;
    expect(firstChild).toBeNull();
  });

  test('should return null when user dismissed notifications for future', () => {
    mockedUseAvailabeUpdates.mockImplementation(() => ({
      isLoading: false,
      availableUpdates: {
        last_check: '2021-09-30T14:00:00.000Z',
        mayor: [
          {
            title: 'Wazuh 4.2.6',
            description:
              'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
            published_date: '2021-09-30T14:00:00.000Z',
            semver: {
              mayor: 4,
              minor: 2,
              patch: 6,
            },
            tag: 'v4.2.6',
          },
        ],
        minor: [],
        patch: [],
      },
    }));
    mockedUseUserPreferences.mockImplementation(() => ({
      isLoading: false,
      userPreferences: { hide_update_notifications: true, last_dismissed_update: 'v4.2.1' },
    }));

    const { container } = render(
      <TestProviders>
        <UpdatesNotification />
      </TestProviders>
    );

    expect(container).toMatchSnapshot();

    const firstChild = container.firstChild;
    expect(firstChild).toBeNull();
  });

  test('should return null when user already dismissed the notifications for current update', () => {
    mockedUseAvailabeUpdates.mockImplementation(() => ({
      isLoading: false,
      availableUpdates: {
        last_check: '2021-09-30T14:00:00.000Z',
        mayor: [
          {
            title: 'Wazuh 4.2.6',
            description:
              'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
            published_date: '2021-09-30T14:00:00.000Z',
            semver: {
              mayor: 4,
              minor: 2,
              patch: 6,
            },
            tag: 'v4.2.6',
          },
        ],
        minor: [],
        patch: [],
      },
    }));
    mockedUseUserPreferences.mockImplementation(() => ({
      isLoading: false,
      userPreferences: { hide_update_notifications: false, last_dismissed_update: 'v4.2.6' },
    }));
    mockedGetCurrentAvailableUpdate.mockImplementation(() => ({
      title: 'Wazuh 4.2.6',
      description:
        'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
      published_date: '2021-09-30T14:00:00.000Z',
      semver: {
        mayor: 4,
        minor: 2,
        patch: 6,
      },
      tag: 'v4.2.6',
    }));

    const { container } = render(
      <TestProviders>
        <UpdatesNotification />
      </TestProviders>
    );

    expect(container).toMatchSnapshot();

    const firstChild = container.firstChild;
    expect(firstChild).toBeNull();
  });
});

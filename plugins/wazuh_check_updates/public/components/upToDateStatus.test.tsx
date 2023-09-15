// To launch this file
// yarn test:jest --verbose public/components/upToDateStatus

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { TestProviders } from '../test/test-utils';
import { UpToDateStatus } from './upToDateStatus';
import { useAvailableUpdates } from '../hooks';

const mockedUseAvailabeUpdates = useAvailableUpdates as jest.Mock;
jest.mock('../hooks/useAvailableUpdates');

jest.mock('../utils/getCurrentAvailableUpdate', () => ({
  getCurrentAvailableUpdate: jest.fn().mockReturnValue({
    title: 'Wazuh 4.2.6',
    description:
      'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
    published_date: '2021-09-30T14:00:00.000Z',
    semver: {
      mayor: 4,
      minor: 2,
      patch: 6,
    },
    tag: '4.2.6',
  }),
}));

jest.mock('../utils/time', () => ({
  formatUIDate: jest.fn().mockReturnValue('2023-09-18T14:00:00.000Z'),
}));

describe('UpToDateStatus component', () => {
  test('should render a initial state with a loader and a loader button', () => {
    mockedUseAvailabeUpdates.mockImplementation(() => ({ isLoading: true }));

    const { container, getByRole } = render(
      <TestProviders>
        <UpToDateStatus
          setCurrentUpdate={() => ({
            title: 'Wazuh 4.2.6',
            description:
              'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
            published_date: '2021-09-30T14:00:00.000Z',
            semver: {
              mayor: 4,
              minor: 2,
              patch: 6,
            },
            tag: '4.2.6',
          })}
        />
      </TestProviders>
    );

    expect(container).toMatchSnapshot();

    const loaders = container.getElementsByClassName('euiLoadingSpinner');
    expect(loaders.length).toBe(2);

    const checkUpdatesButton = getByRole('button', { name: 'Check updates' });
    expect(checkUpdatesButton).toBeInTheDocument();
  });

  test('should render the available updates status with a tooltip and a button to check updates without loaders', async () => {
    mockedUseAvailabeUpdates.mockImplementation(() => ({
      availableUpdates: {
        last_check: '2023-09-18T14:00:00.000Z',
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
            tag: '4.2.6',
          },
        ],
        minor: [],
        patch: [],
      },
      isLoading: false,
      refreshAvailableUpdates: jest.fn().mockResolvedValue({}),
    }));

    const { container, getByRole, getByText } = render(
      <TestProviders>
        <UpToDateStatus
          setCurrentUpdate={() => ({
            title: 'Wazuh 4.2.6',
            description:
              'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
            published_date: '2021-09-30T14:00:00.000Z',
            semver: {
              mayor: 4,
              minor: 2,
              patch: 6,
            },
            tag: '4.2.6',
          })}
        />
      </TestProviders>
    );

    expect(container).toMatchSnapshot();

    const checkUpdatesButton = getByRole('button', { name: 'Check updates' });
    expect(checkUpdatesButton).toBeInTheDocument();

    const availableUpdates = getByText('Available updates');
    expect(availableUpdates).toBeInTheDocument();

    const helpIcon = container.getElementsByClassName('euiToolTipAnchor');

    await userEvent.hover(helpIcon[0]);
    waitFor(() => {
      expect(getByText('Last check')).toBeInTheDocument();
      expect(getByText('2023-09-18T14:00:00.000Z')).toBeInTheDocument();
    });

    const loaders = container.getElementsByClassName('euiLoadingSpinner');
    expect(loaders.length).toBe(0);
  });

  test('should retrieve available updates when click the button', async () => {
    mockedUseAvailabeUpdates.mockImplementation(() => ({ isLoading: true }));

    const { container, getByRole, getByText } = render(
      <TestProviders>
        <UpToDateStatus
          setCurrentUpdate={() => ({
            title: 'Wazuh 4.2.6',
            description:
              'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
            published_date: '2021-09-30T14:00:00.000Z',
            semver: {
              mayor: 4,
              minor: 2,
              patch: 6,
            },
            tag: '4.2.6',
          })}
        />
      </TestProviders>
    );

    expect(container).toMatchSnapshot();

    const checkUpdatesButton = getByRole('button', { name: 'Check updates' });
    expect(checkUpdatesButton).toBeInTheDocument();
    await userEvent.click(checkUpdatesButton);
    waitFor(async () => {
      const availableUpdates = getByText('Available updates');
      expect(availableUpdates).toBeInTheDocument();

      const helpIcon = container.getElementsByClassName('euiToolTipAnchor');

      await userEvent.hover(helpIcon[0]);
      waitFor(() => {
        expect(getByText('Last check')).toBeInTheDocument();
        expect(getByText('2023-09-18T14:00:00.000Z')).toBeInTheDocument();
      });

      const loaders = container.getElementsByClassName('euiLoadingSpinner');
      expect(loaders.length).toBe(0);
    });
  });

  test('should render a initial state with an error', () => {
    mockedUseAvailabeUpdates.mockImplementation(() => ({
      isLoading: false,
      error: 'This is an error',
    }));

    const { container, getByText } = render(
      <TestProviders>
        <UpToDateStatus
          setCurrentUpdate={() => ({
            title: 'Wazuh 4.2.6',
            description:
              'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
            published_date: '2021-09-30T14:00:00.000Z',
            semver: {
              mayor: 4,
              minor: 2,
              patch: 6,
            },
            tag: '4.2.6',
          })}
        />
      </TestProviders>
    );

    expect(container).toMatchSnapshot();

    const loaders = container.getElementsByClassName('euiLoadingSpinner');
    expect(loaders.length).toBe(0);

    const availableUpdates = getByText('Error trying to get available updates');
    expect(availableUpdates).toBeInTheDocument();
  });
});

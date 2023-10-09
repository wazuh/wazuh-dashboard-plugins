import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DismissNotificationCheck } from './dismiss-notification-check';
import { useUserPreferences } from '../hooks';

jest.mock(
  '../../../../node_modules/@elastic/eui/lib/services/accessibility/html_id_generator',
  () => ({
    htmlIdGenerator: () => () => 'htmlId',
  })
);

const mockedUseUserPreferences = useUserPreferences as jest.Mock;
jest.mock('../hooks/user-preferences');

describe('DismissNotificationCheck component', () => {
  test('should render the check', () => {
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

    const { container, getByText } = render(<DismissNotificationCheck />);

    expect(container).toMatchSnapshot();

    const elementWithTag = getByText('Disable updates notifications');
    expect(elementWithTag).toBeInTheDocument();
  });

  test('should return null when there is an error', () => {
    mockedUseUserPreferences.mockImplementation(() => ({
      error: 'Error',
    }));

    const { container } = render(<DismissNotificationCheck />);

    expect(container).toMatchSnapshot();

    const firstChild = container.firstChild;
    expect(firstChild).toBeNull();
  });
});

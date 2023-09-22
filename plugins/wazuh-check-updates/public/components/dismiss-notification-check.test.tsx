import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CurrentUpdateDetails } from './current-update-details';
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
      userPreferences: { hide_update_notifications: false, last_dismissed_update: 'v4.2.1' },
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

    const { container } = render(<CurrentUpdateDetails />);

    expect(container).toMatchSnapshot();

    const firstChild = container.firstChild;
    expect(firstChild).toBeNull();
  });
});

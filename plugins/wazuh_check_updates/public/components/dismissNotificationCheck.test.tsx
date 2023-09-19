import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CurrentUpdateDetails } from './currentUpdateDetails';
import { TestProviders } from '../test/test-utils';
import { DismissNotificationCheck } from './dismissNotificationCheck';
import { useUserPreferences } from '../hooks';

const mockedUseUserPreferences = useUserPreferences as jest.Mock;
jest.mock('../hooks/useUserPreferences');

describe('DismissNotificationCheck component', () => {
  test('should render the check', () => {
    mockedUseUserPreferences.mockImplementation(() => ({
      isLoading: false,
      userPreferences: { hide_update_notifications: false, last_dismissed_update: 'v4.2.1' },
    }));

    const { container, getByText } = render(
      <TestProviders>
        <DismissNotificationCheck />
      </TestProviders>
    );

    expect(container).toMatchSnapshot();

    const elementWithTag = getByText("I don't want to know about future releases");
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

import React from 'react';
import {
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { CheckForUpdatesAbout } from './check-for-updates-about';

configure({ testIdAttribute: 'data-test-subj' });

describe('CheckForUpdatesAbout', () => {
  test('explains how Check for updates works on demand', async () => {
    render(<CheckForUpdatesAbout />);

    expect(
      screen.queryByTestId('ctiFeedCheckForUpdatesAboutFlyout'),
    ).toBeNull();
    fireEvent.click(screen.getByLabelText('How Check for updates works'));

    const flyout = screen.getByTestId('ctiFeedCheckForUpdatesAboutFlyout');
    expect(flyout).toHaveTextContent('About Check for updates');
    expect(flyout).toHaveTextContent('Checks for new content');
    expect(flyout).toHaveTextContent('Updates what changed');
    expect(flyout).toHaveTextContent(
      'a check that finds nothing only changes Last checked',
    );

    fireEvent.click(screen.getByTestId('euiFlyoutCloseButton'));
    await waitFor(() =>
      expect(
        screen.queryByTestId('ctiFeedCheckForUpdatesAboutFlyout'),
      ).toBeNull(),
    );
  });
});

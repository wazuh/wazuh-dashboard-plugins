// To launch this file
// yarn test:jest --verbose public/components/currentUpdateDetails

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CurrentUpdateDetails } from './currentUpdateDetails';
import { TestProviders } from '../test/test-utils';

describe('CurrentUpdateDetails component', () => {
  test('should render the current update tag and links to the Relese Notes and the Upgrade Guide', () => {
    const { container, getByText, getByRole } = render(
      <TestProviders>
        <CurrentUpdateDetails
          currentUpdate={{
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
          }}
        />
      </TestProviders>
    );

    expect(container).toMatchSnapshot();

    const elementWithTag = getByText('4.2.6');
    expect(elementWithTag).toBeInTheDocument();

    const releaseNotesUrl = 'https://documentation.wazuh.com/4.2/release-notes/release-4-2-6.html';
    const releaseNotesLink = getByRole('link', { name: 'Release notes' });
    expect(releaseNotesLink).toHaveAttribute('href', releaseNotesUrl);

    const upgradeGuideUrl = `https://documentation.wazuh.com/4.2/upgrade-guide/index.html`;
    const upgradeGuideLink = getByRole('link', { name: 'Upgrade guide' });
    expect(upgradeGuideLink).toHaveAttribute('href', upgradeGuideUrl);
  });

  test('should return null when there is no current update', () => {
    const { container } = render(<CurrentUpdateDetails />);

    expect(container).toMatchSnapshot();

    const firstChild = container.firstChild;
    expect(firstChild).toBeNull();
  });
});

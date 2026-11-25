import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import LocalPackageCallout from './local-package-callout';

const PACKAGE_NAME = 'wazuh-agent_5.0.0_amd64.deb';
const URL_PACKAGE = `https://packages.example.com/${PACKAGE_NAME}`;

describe('LocalPackageCallout', () => {
  it('names the package to copy and where to download it', () => {
    const { container } = render(
      <LocalPackageCallout
        packageName={PACKAGE_NAME}
        urlPackage={URL_PACKAGE}
      />,
    );

    expect(container).toHaveTextContent(
      `Copy ${PACKAGE_NAME} to the endpoint and run the command in the folder that holds it.`,
    );
    expect(
      screen.getByRole('link', { name: /packages\.example\.com/ }),
    ).toHaveAttribute('href', URL_PACKAGE);
  });
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import PackageSource from './package-source';

const PACKAGE_NAME = 'wazuh-agent_5.0.0_amd64.deb';
const URL_PACKAGE = `https://packages.example.com/${PACKAGE_NAME}`;

const renderPackageSource = (usesLocalPackage: boolean) => {
  const onChange = jest.fn();
  const { container } = render(
    <PackageSource
      usesLocalPackage={usesLocalPackage}
      onChange={onChange}
      packageName={PACKAGE_NAME}
      urlPackage={URL_PACKAGE}
    />,
  );
  const help = () =>
    container.querySelector('[data-test-subj="registerAgentLocalPackageHelp"]');
  return { onChange, help };
};

describe('PackageSource', () => {
  it('offers the local package and hides the help while it is off', () => {
    const { help } = renderPackageSource(false);

    expect(
      screen.getByText('I already have the package on the endpoint'),
    ).toBeInTheDocument();
    expect(screen.getByRole('switch')).not.toBeChecked();
    expect(help()).toBeNull();
  });

  it('reports the new choice', () => {
    const { onChange } = renderPackageSource(false);

    fireEvent.click(screen.getByRole('switch'));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('names the package to copy and where to download it', () => {
    const { help } = renderPackageSource(true);

    expect(screen.getByRole('switch')).toBeChecked();
    expect(help()).toHaveTextContent(`Copy ${PACKAGE_NAME} to the endpoint`);
    expect(
      screen.getByRole('link', { name: /packages\.example\.com/ }),
    ).toHaveAttribute('href', URL_PACKAGE);
  });
});

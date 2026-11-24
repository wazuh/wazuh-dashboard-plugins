import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import InstallCommandOptions, {
  tCommandSecret,
} from './install-command-options';

const renderOptions = ({
  secret = 'enrollmentToken',
  showSecret = false,
  withLocalPackage = true,
  localPackageEnabled = false,
}: {
  secret?: tCommandSecret | null;
  showSecret?: boolean;
  withLocalPackage?: boolean;
  localPackageEnabled?: boolean;
} = {}) => {
  const onShowSecretChange = jest.fn();
  const onLocalPackageChange = jest.fn();
  const { container } = render(
    <InstallCommandOptions
      secret={secret ?? undefined}
      showSecret={showSecret}
      onShowSecretChange={onShowSecretChange}
      localPackage={
        withLocalPackage
          ? {
              enabled: localPackageEnabled,
              onChange: onLocalPackageChange,
            }
          : undefined
      }
    />,
  );
  return { container, onShowSecretChange, onLocalPackageChange };
};

const showTokenButton = () =>
  screen.getByRole('button', { name: 'Show enrollment token' });
const localPackageButton = () =>
  screen.getByRole('button', {
    name: 'I already have the package on the endpoint',
  });

describe('InstallCommandOptions', () => {
  it('offers both options, unselected', () => {
    renderOptions();

    expect(showTokenButton()).toHaveAttribute('aria-pressed', 'false');
    expect(localPackageButton()).toHaveAttribute('aria-pressed', 'false');
  });

  it('names the password option when the command carries a password', () => {
    renderOptions({ secret: 'password' });

    expect(
      screen.getByRole('button', { name: 'Show password' }),
    ).toBeInTheDocument();
  });

  it('toggles each option on its own', () => {
    const { onShowSecretChange, onLocalPackageChange } = renderOptions({
      showSecret: true,
    });

    fireEvent.click(showTokenButton());
    expect(onShowSecretChange).toHaveBeenCalledWith(false);
    expect(onLocalPackageChange).not.toHaveBeenCalled();

    fireEvent.click(localPackageButton());
    expect(onLocalPackageChange).toHaveBeenCalledWith(true);
    expect(onShowSecretChange).toHaveBeenCalledTimes(1);
  });

  it('describes each option in a tooltip', async () => {
    renderOptions();

    fireEvent.mouseOver(screen.getByText('Show enrollment token'));
    expect(
      await screen.findByText(
        'Shows the enrollment token in the command. The copied command always includes it.',
      ),
    ).toBeInTheDocument();

    fireEvent.mouseOver(
      screen.getByText('I already have the package on the endpoint'),
    );
    expect(
      await screen.findByText(
        'Shows a command that installs a package already copied to the endpoint, for endpoints without Internet access.',
      ),
    ).toBeInTheDocument();
  });

  it('marks the selected options', () => {
    renderOptions({ showSecret: true, localPackageEnabled: true });

    expect(showTokenButton()).toHaveAttribute('aria-pressed', 'true');
    expect(localPackageButton()).toHaveAttribute('aria-pressed', 'true');
  });

  it('leaves out the options that do not apply', () => {
    renderOptions({ secret: null });
    expect(
      screen.queryByRole('button', { name: /Show/ }),
    ).not.toBeInTheDocument();
    expect(localPackageButton()).toBeInTheDocument();
  });

  it('renders nothing when no option applies', () => {
    const { container } = renderOptions({
      secret: null,
      withLocalPackage: false,
    });
    expect(container).toBeEmptyDOMElement();
  });
});

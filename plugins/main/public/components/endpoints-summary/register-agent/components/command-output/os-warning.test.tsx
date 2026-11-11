import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import OsCommandWarning from './os-warning';

describe('OsCommandWarning', () => {
  it('asks for a PowerShell terminal opened as Administrator on Windows', () => {
    render(<OsCommandWarning os='WINDOWS' />);

    expect(
      screen.getByText(
        'Run these commands in a Windows PowerShell terminal opened as Administrator.',
      ),
    ).toBeInTheDocument();
  });

  const debTools =
    'The gnupg and binutils packages are required to check the package signature.';

  it.each(['DEB amd64', 'DEB aarch64'])(
    'lists the tools of the signature check for %s',
    architecture => {
      render(<OsCommandWarning os='LINUX' architecture={architecture} />);
      expect(screen.getByText(debTools)).toBeInTheDocument();
    },
  );

  it.each(['RPM amd64', 'RPM aarch64'])(
    'does not list them for %s',
    architecture => {
      render(<OsCommandWarning os='LINUX' architecture={architecture} />);
      expect(screen.queryByText(debTools)).not.toBeInTheDocument();
    },
  );
});

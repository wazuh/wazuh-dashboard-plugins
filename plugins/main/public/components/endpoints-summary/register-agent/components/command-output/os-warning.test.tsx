import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import OsCommandWarning from './os-warning';

describe('OsCommandWarning', () => {
  it.each(['LINUX', 'macOS'] as const)(
    'asks for a terminal and sudo rights on %s, without requiring Bash',
    os => {
      const { container } = render(<OsCommandWarning os={os} />);

      expect(
        screen.getByText(
          'Run the commands below in a terminal on the endpoint, as a user with sudo rights.',
        ),
      ).toBeInTheDocument();
      expect(container).not.toHaveTextContent(/bash|administrator/i);
    },
  );

  it('asks for PowerShell opened as Administrator on Windows', () => {
    render(<OsCommandWarning os='WINDOWS' />);

    expect(
      screen.getByText(
        'Run the commands below on the endpoint, in PowerShell 3.0 or later opened as Administrator.',
      ),
    ).toBeInTheDocument();
  });

  it('renders nothing before a package is selected', () => {
    const { container } = render(<OsCommandWarning />);

    expect(container).toBeEmptyDOMElement();
  });
});

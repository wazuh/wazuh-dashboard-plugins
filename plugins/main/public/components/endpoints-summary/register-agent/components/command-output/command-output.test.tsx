import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import CommandOutput from './command-output';

const COMMAND =
  "sudo WAZUH_ENROLLMENT_TOKEN='secret-token' dpkg -i ./wazuh-agent.deb";

const renderCommand = (showSecret?: boolean) =>
  render(
    <CommandOutput
      commandText={COMMAND}
      showCommand
      onCopy={jest.fn()}
      os='LINUX'
      enrollmentToken='secret-token'
      showSecret={showSecret}
    />,
  );

describe('CommandOutput', () => {
  it('masks the enrollment token by default', () => {
    const { container } = renderCommand();

    expect(container).not.toHaveTextContent('secret-token');
    expect(container).toHaveTextContent(
      `WAZUH_ENROLLMENT_TOKEN='${'*'.repeat(32)}'`,
    );
  });

  it('shows the enrollment token when asked to', () => {
    const { container } = renderCommand(true);

    expect(container).toHaveTextContent(COMMAND);
  });

  it('renders no switch of its own', () => {
    renderCommand();

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});

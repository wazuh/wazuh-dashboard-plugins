import React from 'react';
import { EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { tOperatingSystem } from '../../core/config/os-commands-definitions';

interface OsWarningProps {
  os?: tOperatingSystem['name'];
}

export default function OsCommandWarning(props: OsWarningProps) {
  // The Linux and macOS commands are POSIX shell and take root with sudo.
  const sudoTerminal = i18n.translate(
    'wazuh.endpointsSummary.osWarning.sudoTerminal',
    {
      defaultMessage:
        'Run the commands below in a terminal on the endpoint, as a user with sudo rights.',
    },
  );
  const messages: Record<tOperatingSystem['name'], string> = {
    WINDOWS: i18n.translate(
      'wazuh.endpointsSummary.osWarning.powerShellAdministrator',
      {
        defaultMessage:
          'Run the commands below on the endpoint, in PowerShell 3.0 or later opened as Administrator.',
      },
    ),
    LINUX: sudoTerminal,
    macOS: sudoTerminal,
  };
  const message = props.os && messages[props.os];

  return message ? (
    <EuiText size='s'>
      <p>{message}</p>
    </EuiText>
  ) : null;
}

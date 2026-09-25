import React from 'react';
import { EuiCallOut } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { tOperatingSystem } from '../../core/config/os-commands-definitions';

interface OsWarningProps {
  os?: tOperatingSystem['name'];
}

export default function OsCommandWarning(props: OsWarningProps) {
  const title = i18n.translate('wazuh.endpointsSummary.osWarning.title', {
    defaultMessage: 'Requirements',
  });
  const administratorPrivileges = i18n.translate(
    'wazuh.endpointsSummary.osWarning.administratorPrivileges',
    {
      defaultMessage:
        'You will need administrator privileges to perform this installation.',
    },
  );
  const shellBashRequired = i18n.translate(
    'wazuh.endpointsSummary.osWarning.shellBashRequired',
    { defaultMessage: 'Shell Bash is required.' },
  );
  const shellBashTerminal = i18n.translate(
    'wazuh.endpointsSummary.osWarning.shellBashTerminal',
    {
      defaultMessage:
        'Keep in mind you need to run this command in a Shell Bash terminal.',
    },
  );
  const osSelector = {
    WINDOWS: (
      <EuiCallOut title={title} iconType='iInCircle'>
        <ul className='wz-callout-list'>
          <li>
            <span>{administratorPrivileges}</span>
          </li>
          <li>
            <span>
              {i18n.translate(
                'wazuh.endpointsSummary.osWarning.powerShellRequired',
                { defaultMessage: 'PowerShell 3.0 or greater is required.' },
              )}
            </span>
          </li>
        </ul>
        <p>
          {i18n.translate(
            'wazuh.endpointsSummary.osWarning.powerShellTerminal',
            {
              defaultMessage:
                'Keep in mind you need to run this command in a Windows PowerShell terminal.',
            },
          )}
        </p>
      </EuiCallOut>
    ),
    LINUX: (
      <EuiCallOut title={title} iconType='iInCircle'>
        <ul className='wz-callout-list'>
          <li>
            <span>{administratorPrivileges}</span>
          </li>
          <li>
            <span>{shellBashRequired}</span>
          </li>
        </ul>
        <p>{shellBashTerminal}</p>
      </EuiCallOut>
    ),
    macOS: (
      <EuiCallOut title={title} iconType='iInCircle'>
        <ul className='wz-callout-list'>
          <li>
            <span>{administratorPrivileges}</span>
          </li>
          <li>
            <span>{shellBashRequired}</span>
          </li>
        </ul>
        <p>{shellBashTerminal}</p>
      </EuiCallOut>
    ),
  };

  return osSelector[props?.os] || null;
}

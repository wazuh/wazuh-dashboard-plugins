import React from 'react';
import { EuiCallOut } from '@elastic/eui';
import { TOperatingSystem } from '../../core/config/os-commands-definitions';

interface OsWarningProps {
  os?: TOperatingSystem['name'];
}

export default function OsCommandWarning(props: OsWarningProps) {
  const osSelector = {
    WINDOWS: (
      <EuiCallOut title='Requirements' iconType='iInCircle'>
        <ul className='wz-callout-list'>
          <li>
            <span>
              You will need administrator privileges to perform this
              installation.
            </span>
          </li>
          <li>
            <span>PowerShell 3.0 or greater is required.</span>
          </li>
        </ul>
        <p>
          Keep in mind you need to run this command in a Windows PowerShell
          terminal.
        </p>
      </EuiCallOut>
    ),
    LINUX: (
      <EuiCallOut title='Requirements' iconType='iInCircle'>
        <ul className='wz-callout-list'>
          <li>
            <span>
              You will need administrator privileges to perform this
              installation.
            </span>
          </li>
          <li>
            <span>Shell Bash is required.</span>
          </li>
        </ul>
        <p>
          Keep in mind you need to run this command in a Shell Bash terminal.
        </p>
      </EuiCallOut>
    ),
    macOS: (
      <EuiCallOut title='Requirements' iconType='iInCircle'>
        <ul className='wz-callout-list'>
          <li>
            <span>
              You will need administrator privileges to perform this
              installation.
            </span>
          </li>
          <li>
            <span>Shell Bash is required.</span>
          </li>
        </ul>
        <p>
          Keep in mind you need to run this command in a Shell Bash terminal.
        </p>
      </EuiCallOut>
    ),
  };

  return osSelector[props?.os] || null;
}

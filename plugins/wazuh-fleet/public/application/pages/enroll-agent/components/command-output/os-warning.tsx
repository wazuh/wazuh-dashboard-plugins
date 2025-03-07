import React from 'react';
import { EuiCallOut } from '@elastic/eui';

const osSelector = {
  windows: (
    <EuiCallOut title='Requirements' iconType='iInCircle'>
      <ul className='wz-callout-list'>
        <li>
          <span>
            You will need administrator privileges to perform this installation.
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
  linux: (
    <EuiCallOut title='Requirements' iconType='iInCircle'>
      <ul className='wz-callout-list'>
        <li>
          <span>
            You will need administrator privileges to perform this installation.
          </span>
        </li>
        <li>
          <span>Shell Bash is required.</span>
        </li>
      </ul>
      <p>Keep in mind you need to run this command in a Shell Bash terminal.</p>
    </EuiCallOut>
  ),
  macos: (
    <EuiCallOut title='Requirements' iconType='iInCircle'>
      <ul className='wz-callout-list'>
        <li>
          <span>
            You will need administrator privileges to perform this installation.
          </span>
        </li>
        <li>
          <span>Shell Bash is required.</span>
        </li>
      </ul>
      <p>Keep in mind you need to run this command in a Shell Bash terminal.</p>
    </EuiCallOut>
  ),
};

interface OsWarningProps {
  operatingSystemSelection?: keyof typeof osSelector;
}

export default function OsCommandWarning(props: OsWarningProps) {
  const system = Object.keys(osSelector).find(system =>
    props?.operatingSystemSelection?.startsWith(system),
  );

  return system ? osSelector[system] : null;
}

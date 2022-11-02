import React from 'react';
import { EuiCallOut, EuiSpacer } from '@elastic/eui';

export default function WindowsAdvice() {
  return (
    <>
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
      <EuiSpacer />
    </>
  );
}

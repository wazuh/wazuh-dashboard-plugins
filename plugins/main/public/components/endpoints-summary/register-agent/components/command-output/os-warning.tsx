import React from 'react';
import { EuiCallOut } from '@elastic/eui';
import { tOperatingSystem } from '../../core/config/os-commands-definitions';
import { endpointsSummaryI18n } from '../../../i18n';

const dw = endpointsSummaryI18n.deployWizard;

interface OsWarningProps {
  os?: tOperatingSystem['name'];
}

export default function OsCommandWarning(props: OsWarningProps) {
  const osSelector = {
    WINDOWS: (
      <EuiCallOut title={dw.requirements} iconType='iInCircle'>
        <ul className='wz-callout-list'>
          <li>
            <span>{dw.adminPrivileges}</span>
          </li>
          <li>
            <span>{dw.powershellRequired}</span>
          </li>
        </ul>
        <p>{dw.runInPowerShell}</p>
      </EuiCallOut>
    ),
    LINUX: (
      <EuiCallOut title={dw.requirements} iconType='iInCircle'>
        <ul className='wz-callout-list'>
          <li>
            <span>{dw.adminPrivileges}</span>
          </li>
          <li>
            <span>{dw.bashRequired}</span>
          </li>
        </ul>
        <p>{dw.runInBash}</p>
      </EuiCallOut>
    ),
    macOS: (
      <EuiCallOut title={dw.requirements} iconType='iInCircle'>
        <ul className='wz-callout-list'>
          <li>
            <span>{dw.adminPrivileges}</span>
          </li>
          <li>
            <span>{dw.bashRequired}</span>
          </li>
        </ul>
        <p>{dw.runInBash}</p>
      </EuiCallOut>
    ),
  };

  return osSelector[props?.os] || null;
}

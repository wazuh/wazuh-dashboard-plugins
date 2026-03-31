import React from 'react';
import { EuiCallOut } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { tOperatingSystem } from '../../core/config/os-commands-definitions';

interface OsWarningProps {
  os?: tOperatingSystem['name'];
}

export default function OsCommandWarning(props: OsWarningProps) {
  const osSelector = {
    WINDOWS: (
      <EuiCallOut title={i18n.translate('wazuh.registerAgent.requirements', {
        defaultMessage: 'Requirements'
      })} iconType='iInCircle'>
        <ul className='wz-callout-list'>
          <li>
            <span>
              {i18n.translate('wazuh.registerAgent.adminPrivilegesRequired', {
                defaultMessage: 'You will need administrator privileges to perform this installation.'
              })}
            </span>
          </li>
          <li>
            <span>{i18n.translate('wazuh.registerAgent.powershellRequired', {
              defaultMessage: 'PowerShell 3.0 or greater is required.'
            })}</span>
          </li>
        </ul>
        <p>
          {i18n.translate('wazuh.registerAgent.powershellTerminalNote', {
            defaultMessage: 'Keep in mind you need to run this command in a Windows PowerShell terminal.'
          })}
        </p>
      </EuiCallOut>
    ),
    LINUX: (
      <EuiCallOut title={i18n.translate('wazuh.registerAgent.requirements', {
        defaultMessage: 'Requirements'
      })} iconType='iInCircle'>
        <ul className='wz-callout-list'>
          <li>
            <span>
              {i18n.translate('wazuh.registerAgent.adminPrivilegesRequired', {
                defaultMessage: 'You will need administrator privileges to perform this installation.'
              })}
            </span>
          </li>
          <li>
            <span>{i18n.translate('wazuh.registerAgent.bashRequired', {
              defaultMessage: 'Shell Bash is required.'
            })}</span>
          </li>
        </ul>
        <p>
          {i18n.translate('wazuh.registerAgent.bashTerminalNote', {
            defaultMessage: 'Keep in mind you need to run this command in a Shell Bash terminal.'
          })}
        </p>
      </EuiCallOut>
    ),
    macOS: (
      <EuiCallOut title={i18n.translate('wazuh.registerAgent.requirements', {
        defaultMessage: 'Requirements'
      })} iconType='iInCircle'>
        <ul className='wz-callout-list'>
          <li>
            <span>
              {i18n.translate('wazuh.registerAgent.adminPrivilegesRequired', {
                defaultMessage: 'You will need administrator privileges to perform this installation.'
              })}
            </span>
          </li>
          <li>
            <span>{i18n.translate('wazuh.registerAgent.bashRequired', {
              defaultMessage: 'Shell Bash is required.'
            })}</span>
          </li>
        </ul>
        <p>
          {i18n.translate('wazuh.registerAgent.bashTerminalNote', {
            defaultMessage: 'Keep in mind you need to run this command in a Shell Bash terminal.'
          })}
        </p>
      </EuiCallOut>
    ),
  };

  return osSelector[props?.os] || null;
}

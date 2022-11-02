import React from 'react';
import {
  EuiCallOut,
  EuiText,
  EuiSpacer,
  EuiCodeBlock,
  EuiCopy,
  EuiSwitch,
  EuiIcon,
} from '@elastic/eui';
import { obfuscatePassword } from '../register-agent-service';
import { WindowsAdvice } from '../components';

export default function InstallEnrollAgent(props: any) {
  const {
    gotErrorRegistrationServiceInfo,
    selectedOS,
    wazuhPassword,
    commandText,
    language,
    showPassword,
    needsPassword,
    onSetShowPassword,
  } = props;

  return (
    <div>
      {gotErrorRegistrationServiceInfo ? (
        <EuiCallOut
          color='danger'
          title='This section could not be displayed because you do not have permission to get access to the registration service.'
          iconType='iInCircle'
        />
      ) : (
        selectedOS && (
          <EuiText>
            <p>
              You can use this command to install and enroll the Wazuh agent in
              one or more hosts.
            </p>
            <EuiCallOut
              color='warning'
              title={
                <>
                  If the installer finds another Wazuh agent in the system, it
                  will upgrade it preserving the configuration.
                </>
              }
              iconType='iInCircle'
            />
            <EuiSpacer />
            {selectedOS === 'win' && <WindowsAdvice />}
            <div className='copy-codeblock-wrapper'>
              <EuiCodeBlock language={language}>
                {wazuhPassword && !showPassword
                  ? obfuscatePassword(commandText)
                  : commandText}
              </EuiCodeBlock>
              <EuiCopy textToCopy={commandText}>
                {copy => (
                  <div className='copy-overlay' onClick={copy}>
                    <p>
                      <EuiIcon type='copy' /> Copy command
                    </p>
                  </div>
                )}
              </EuiCopy>
            </div>
            {needsPassword && (
              <EuiSwitch
                label='Show password'
                checked={showPassword}
                onChange={active => onSetShowPassword(active)}
              />
            )}
            <EuiSpacer />
          </EuiText>
        )
      )}
    </div>
  );
}

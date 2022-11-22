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
import {
  agentNameVariable,
  getCommandText,
  obfuscatePassword,
} from '../../services/register-agent-service';
import { PermissionsAdvice, WindowsAdvice } from '../../components';

export default function InstallEnrollAgent(props: any) {
  const {
    gotErrorRegistrationServiceInfo,
    os,
    version,
    architecture,
    wazuhVersion,
    agentName,
    wazuhPassword,
    language,
    showPassword,
    needsPassword,
    onSetShowPassword,
    agentGroup,
  } = props;

  const commandText = getCommandText({
    os,
    version,
    architecture,
    wazuhVersion,
    agentGroup,
    agentName: agentNameVariable(agentName, architecture),
  });

  return (
    <div>
      {gotErrorRegistrationServiceInfo ? (
        <PermissionsAdvice />
      ) : (
        os && (
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
            {os === 'win' && <WindowsAdvice />}
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

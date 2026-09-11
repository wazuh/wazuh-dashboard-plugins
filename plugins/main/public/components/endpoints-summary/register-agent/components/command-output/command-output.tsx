import {
  EuiCodeBlock,
  EuiCopy,
  EuiIcon,
  EuiSpacer,
  EuiSwitch,
  EuiSwitchEvent,
  EuiText,
} from '@elastic/eui';
import React, { Fragment, useEffect, useState } from 'react';
import { tOperatingSystem } from '../../core/config/os-commands-definitions';
import { osdfucatePasswordInCommand } from '../../services/wazuh-password-service';
import { obfuscateEnrollmentTokenInCommand } from '../../services/enrollment-token-command-service';

interface ICommandSectionProps {
  commandText: string;
  showCommand: boolean;
  onCopy: () => void;
  os?: tOperatingSystem['name'];
  password?: string;
  enrollmentToken?: string;
}

export default function CommandOutput(props: ICommandSectionProps) {
  const { commandText, showCommand, onCopy, os, password, enrollmentToken } =
    props;
  const [showSecret, setShowSecret] = useState(false);

  const onHandleCopy = (command: any) => {
    onCopy && onCopy();
    return command; // the return is needed to avoid a bug in EuiCopy
  };

  const [commandToShow, setCommandToShow] = useState(commandText);

  /* Both the enrollment password and the enrollment token authenticate the
  agent, so neither is rendered in the clear until the operator asks for it.
  Only one of them is ever in the command: the installer refuses a token that
  carries a credential together with a password. */
  const secretLabel = enrollmentToken ? 'enrollment token' : 'password';
  const haveSecret = Boolean(password || enrollmentToken);

  useEffect(() => {
    if (!commandText || !haveSecret || showSecret) {
      setCommandToShow(commandText);
      return;
    }

    let obfuscated = commandText;
    if (password) {
      obfuscated = osdfucatePasswordInCommand(password, obfuscated, os);
    }
    if (enrollmentToken) {
      obfuscated = obfuscateEnrollmentTokenInCommand(obfuscated);
    }
    setCommandToShow(obfuscated);
  }, [password, enrollmentToken, commandText, showSecret, os]);

  const onChangeShowSecret = (event: EuiSwitchEvent) => {
    setShowSecret(event.target.checked);
  };

  return (
    <Fragment>
      <EuiSpacer />
      <EuiText>
        <div className='copy-codeblock-wrapper'>
          <EuiCodeBlock
            style={{
              zIndex: '100',
              wordWrap: 'break-word',
            }}
            language='tsx'
          >
            {showCommand ? commandToShow : ''}
          </EuiCodeBlock>
          {showCommand && (
            <EuiCopy textToCopy={commandText}>
              {copy => (
                <div
                  className='copy-overlay'
                  onClick={() => onHandleCopy(copy())}
                >
                  <p>
                    <EuiIcon type='copy' /> Copy command
                  </p>
                </div>
              )}
            </EuiCopy>
          )}
        </div>
        {showCommand && haveSecret ? (
          <>
            <EuiSwitch
              checked={showSecret}
              label={`Show ${secretLabel}`}
              onChange={onChangeShowSecret}
            />
            <EuiSpacer size='l' />
          </>
        ) : (
          <EuiSpacer size='s' />
        )}
      </EuiText>
    </Fragment>
  );
}

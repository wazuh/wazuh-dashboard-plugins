import {
  EuiCodeBlock,
  EuiCopy,
  EuiIcon,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React, { Fragment, useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
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
  /* The secret is obfuscated until the operator asks to see it. */
  showSecret?: boolean;
}

export default function CommandOutput(props: ICommandSectionProps) {
  const {
    commandText,
    showCommand,
    onCopy,
    os,
    password,
    enrollmentToken,
    showSecret = false,
  } = props;

  const onHandleCopy = (command: any) => {
    onCopy && onCopy();
    return command; // the return is needed to avoid a bug in EuiCopy
  };

  const [commandToShow, setCommandToShow] = useState(commandText);

  /* Both the enrollment password and the enrollment token authenticate the
  agent, so neither is rendered in the clear until the operator asks for it.
  Only one of them is ever in the command: the installer refuses a token that
  carries a credential together with a password. */
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

  return (
    <Fragment>
      <EuiSpacer />
      <EuiText>
        <div
          className='copy-codeblock-wrapper'
          style={{
            wordBreak: 'break-word',
          }}
        >
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
                    <EuiIcon type='copy' />{' '}
                    {i18n.translate(
                      'wazuh.endpointsSummary.commandOutput.copyCommand',
                      { defaultMessage: 'Copy command' },
                    )}
                  </p>
                </div>
              )}
            </EuiCopy>
          )}
        </div>
        <EuiSpacer size='s' />
      </EuiText>
    </Fragment>
  );
}

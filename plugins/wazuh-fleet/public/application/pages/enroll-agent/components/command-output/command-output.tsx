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
import { TOperatingSystem } from '../../core/config/os-commands-definitions';
import { obfuscatePasswordInCommand } from '../../services/wazuh-password-service';
import './command-output.scss';
import { getCore } from '../../../../../plugin-services';

const IS_DARK_THEME = getCore().uiSettings.get('theme:darkMode');

/* tslint-disable no-undef */
if (IS_DARK_THEME) {
  // eslint-disable-next-line unicorn/prefer-top-level-await
  import('./command-output.dark.scss').then();
}

interface ICommandSectionProps {
  commandText: string;
  showCommand: boolean;
  onCopy: () => void;
  os?: TOperatingSystem['name'];
  password?: string;
}

export default function CommandOutput(props: ICommandSectionProps) {
  const { commandText, showCommand, onCopy, os, password } = props;
  const [havePassword, setHavePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onHandleCopy = (command: any) => {
    if (onCopy) {
      onCopy();
    }

    return command; // the return is needed to avoid a bug in EuiCopy
  };

  const [commandToShow, setCommandToShow] = useState(commandText);

  const obfuscatePassword = (password: string) => {
    if (!password) {
      return;
    }

    if (!commandText) {
      return;
    }

    if (showPassword) {
      setCommandToShow(commandText);
    } else {
      setCommandToShow(obfuscatePasswordInCommand(password, commandText, os));
    }
  };

  useEffect(() => {
    if (password) {
      setHavePassword(true);
      obfuscatePassword(password);
    } else {
      setHavePassword(false);
      setCommandToShow(commandText);
    }
  }, [password, commandText, showPassword]);

  const onChangeShowPassword = (event: EuiSwitchEvent) => {
    setShowPassword(event.target.checked);
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
        {showCommand && havePassword ? (
          <>
            <EuiSwitch
              checked={showPassword}
              label='Show password'
              onChange={onChangeShowPassword}
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

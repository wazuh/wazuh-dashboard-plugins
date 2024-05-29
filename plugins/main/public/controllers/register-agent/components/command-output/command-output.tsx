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

interface ICommandSectionProps {
  commandText: string;
  showCommand: boolean;
  onCopy: () => void;
  os?: tOperatingSystem['name'];
  password?: string;
}

export default function CommandOutput(props: ICommandSectionProps) {
  const { commandText, showCommand, onCopy, os, password } = props;
  const [havePassword, setHavePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onHandleCopy = (command: any) => {
    onCopy && onCopy();
    return command; // the return is needed to avoid a bug in EuiCopy
  };

  const [commandToShow, setCommandToShow] = useState(commandText);

  useEffect(() => {
    if (password) {
      setHavePassword(true);
      osdfucatePassword(password);
    } else {
      setHavePassword(false);
      setCommandToShow(commandText);
    }
  }, [password, commandText, showPassword]);

  const osdfucatePassword = (password: string) => {
    if (!password) return;
    if (!commandText) return;

    if (showPassword) {
      setCommandToShow(commandText);
    } else {
      setCommandToShow(osdfucatePasswordInCommand(password, commandText, os));
    }
  };

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
          <EuiSwitch
            checked={showPassword}
            label='Show password'
            onChange={onChangeShowPassword}
          />
        ) : null}
        <EuiSpacer size='s' />
      </EuiText>
    </Fragment>
  );
}

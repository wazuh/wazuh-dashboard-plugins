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

interface ICommandSectionProps {
  commandText: string;
  showCommand: boolean;
  onCopy: () => void;
  os?: 'WINDOWS' | string;
  password?: string;
}

export default function CommandOutput(props: ICommandSectionProps) {
  const { commandText, showCommand, onCopy, os, password } = props;
  const getHighlightCodeLanguage = (os: 'WINDOWS' | string) => {
    if (os.toLowerCase() === 'windows') {
      return 'powershell';
    } else {
      return 'bash';
    }
  };
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
  }, [password, commandText, showPassword])

  const osdfucatePassword = (password: string) => {
    if(!password) return;
    if(!commandText) return;

    if(showPassword){
      setCommandToShow(commandText);
    }else{
    // search password in commandText and replace with * for every character
      const findPassword = commandText.search(password);
      if (findPassword > -1) {
        const command = commandText;
        setCommandToShow(command.replace(password, '*'.repeat(password.length)));
      }
    }
  }

  const onChangeShowPassword = (event: EuiSwitchEvent) => {
    setShowPassword(event.target.checked);
  }

  return (
    <Fragment>
      <EuiSpacer />
      <EuiText>
        <div className='copy-codeblock-wrapper'>
          <EuiCodeBlock
            style={{
              zIndex: '100',
            }}
            language={getHighlightCodeLanguage(os || '')}
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
        <EuiSpacer size='s' />
        {showCommand && havePassword && <EuiSwitch checked={showPassword} label='Show password' onChange={onChangeShowPassword}/>}
      </EuiText>
    </Fragment>
  );
}

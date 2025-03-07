import React from 'react';
import { EuiCodeBlock, EuiCopy, EuiIcon, EuiText } from '@elastic/eui';
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
  commandCopy?: string;
  onCopy?: () => void;
}

export default function CommandOutput(props: ICommandSectionProps) {
  const { commandText, commandCopy, onCopy } = props;

  const onHandleCopy = (command: any) => {
    if (onCopy) {
      onCopy();
    }

    return command; // the return is needed to avoid a bug in EuiCopy
  };

  return (
    <EuiText>
      <div className='copy-codeblock-wrapper'>
        <EuiCodeBlock
          style={{
            zIndex: '100',
            wordWrap: 'break-word',
          }}
          language='tsx'
        >
          {commandText}
        </EuiCodeBlock>
        <EuiCopy textToCopy={commandCopy || commandText}>
          {copy => (
            <div className='copy-overlay' onClick={() => onHandleCopy(copy())}>
              <p>
                <EuiIcon type='copy' /> Copy command
              </p>
            </div>
          )}
        </EuiCopy>
      </div>
    </EuiText>
  );
}

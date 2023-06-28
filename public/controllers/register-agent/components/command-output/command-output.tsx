import {
  EuiCodeBlock,
  EuiCopy,
  EuiIcon,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React, { Fragment, useState } from 'react';

interface ICommandSectionProps {
  commandText: string;
  showCommand: boolean;
  onCopy: () => void;
  os?: 'WINDOWS' | string;
}

export default function CommandOutput(props: ICommandSectionProps) {
  const { commandText, showCommand, onCopy, os } = props;
  const getHighlightCodeLanguage = (os: 'WINDOWS' | string) => {
    if (os.toLowerCase() === 'windows') {
      return 'powershell';
    } else {
      return 'bash';
    }
  };

  const [language, setLanguage] = useState(getHighlightCodeLanguage(os || ''));

  const onHandleCopy = (command: any) => {
    onCopy && onCopy();
    return command
  };

  const [commandToCopy, setCommandToCopy] = useState(commandText);

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
            {showCommand ? commandText : ''}
          </EuiCodeBlock>
          {showCommand && (
            <EuiCopy textToCopy={commandText}>
              {commandToCopy => (
                <div className='copy-overlay' onClick={() => onHandleCopy(commandToCopy)}>
                  <p>
                    <EuiIcon type='copy' /> Copy command
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

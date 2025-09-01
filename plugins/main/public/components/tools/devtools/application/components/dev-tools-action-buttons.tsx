import React from 'react';
import { EuiFlexGroup, EuiIcon } from '@elastic/eui';
import { DEV_TOOLS_BUTTONS } from '../../constants';

interface DevToolsActionButtonsProps {
  onSendRequestButton: () => void;
}

const DevToolsActionButtons = ({
  onSendRequestButton,
}: DevToolsActionButtonsProps) => {
  return (
    <EuiFlexGroup
      id={DEV_TOOLS_BUTTONS.ID}
      justifyContent='flexEnd'
      gutterSize='none'
    >
      <EuiIcon
        type='play'
        onClick={() => onSendRequestButton()}
        title='Send request'
        id={DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}
        color='success'
      />
      <a href='' target='__blank' id={DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}>
        <EuiIcon type='documentation' />
      </a>
    </EuiFlexGroup>
  );
};

export default DevToolsActionButtons;

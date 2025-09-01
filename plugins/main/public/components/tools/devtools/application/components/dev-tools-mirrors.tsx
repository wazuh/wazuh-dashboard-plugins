import React from 'react';
import DevToolsActionButtons from './dev-tools-action-buttons';
import { EuiFlexGroup } from '@elastic/eui';
import DevToolsColumnSeparator from './separator/dev-tools-column-separator';
import { EDITOR_MIRRORS } from '../../constants';

interface Props {
  onSendRequestButton: () => void;
}

const DevToolsMirrors = ({ onSendRequestButton }: Props) => {
  return (
    <EuiFlexGroup gutterSize='none' direction='row'>
      <EuiFlexGroup
        id={EDITOR_MIRRORS.LEFT_COLUMN_ID}
        gutterSize='none'
        direction='column'
      >
        <DevToolsActionButtons onSendRequestButton={onSendRequestButton} />
        <textarea id={EDITOR_MIRRORS.INPUT_ID} style={{ display: 'none' }} />
      </EuiFlexGroup>
      <DevToolsColumnSeparator />
      <EuiFlexGroup
        id={EDITOR_MIRRORS.RIGHT_COLUMN_ID}
        direction='column'
        gutterSize='none'
        style={{ flexGrow: 1 }}
      >
        <textarea id={EDITOR_MIRRORS.OUTPUT_ID} style={{ display: 'none' }} />
      </EuiFlexGroup>
    </EuiFlexGroup>
  );
};

export default DevToolsMirrors;

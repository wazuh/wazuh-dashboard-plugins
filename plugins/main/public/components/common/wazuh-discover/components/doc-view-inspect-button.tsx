import React from 'react';
import { EuiToolTip, EuiButtonIcon } from '@elastic/eui';

type tDocViewInspectButtonProps = {
    rowIndex: number;
    onClick: (index: number) => void;
}

const DocViewInspectButton = (props: tDocViewInspectButtonProps) => {
    const { rowIndex, onClick } = props;
    const inspectHintMsg = 'Inspect document details';

    const onHandleInspectDoc = () => {
      onClick && onClick(rowIndex);
    }

    return (
      <EuiToolTip content={inspectHintMsg}>
        <EuiButtonIcon
          onClick={() => onHandleInspectDoc()}
          iconType='inspect'
          aria-label={inspectHintMsg}
        />
      </EuiToolTip>
    );
  };

export default DocViewInspectButton;
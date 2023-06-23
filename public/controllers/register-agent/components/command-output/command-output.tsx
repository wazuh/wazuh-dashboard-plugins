import { EuiCodeBlock } from '@elastic/eui';
import React, { Fragment } from 'react';

interface ICommandSectionProps {
  commandText: string;
  showCommand: boolean;
}

export default function CommandOutput(props: ICommandSectionProps) {
  const { commandText, showCommand } = props;
  return (
    <Fragment>
      <EuiCodeBlock language='shell' isCopyable>
        {showCommand ? commandText : ''}
      </EuiCodeBlock>
    </Fragment>
  );
}

import React from 'react';
import { EuiHealth, EuiToolTip } from '@elastic/eui';

interface ColumnWithStatusIconProps {
  color: string;
  text: string;
  tooltip?: string;
}

export const ColumnWithStatusIcon = ({
  color,
  text,
  tooltip,
}: ColumnWithStatusIconProps) => {
  const textTooltip = tooltip ? tooltip : text;
  return (
    <>
      <EuiToolTip position='top' content={textTooltip}>
        <EuiHealth className='wz-flex' color={color}></EuiHealth>
      </EuiToolTip>
      <span className={'hide-agent-status'}>{text}</span>
    </>
  );
};

import React from 'react';
import { EuiHealth, EuiToolTip } from '@elastic/eui';

interface ColumnWithStatusIconProps {
  color: string;
  text: string;
  tooltip?: React.ReactNode;
}

export const ColumnWithStatusIcon = ({
  color,
  text,
  tooltip,
}: ColumnWithStatusIconProps) => (
  // The tooltip anchors the whole value (icon and text), not only the icon
  <EuiToolTip position='top' content={tooltip || text}>
    <EuiHealth color={color}>
      <span className='hide-agent-status'>{text}</span>
    </EuiHealth>
  </EuiToolTip>
);

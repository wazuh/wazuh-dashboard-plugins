import React from 'react';
import { EuiIconTip } from '@elastic/eui';

type IconTipProps = {
  iconType?: string;
  color?: string;
  size?: string;
  isDisabled?: boolean;
  message: string;
};

export const IconTip = ({
  isDisabled = false,
  color = 'primary',
  iconType = 'questionInCircle',
  size = 'm',
  message,
}: IconTipProps) => {
  if (isDisabled) return null;

  return (
    <EuiIconTip type={iconType} color={color} size={size} content={message} />
  );
};

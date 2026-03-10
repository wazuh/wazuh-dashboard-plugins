import React, { useState } from 'react';
import { EuiPopover, EuiIcon, EuiText } from '@elastic/eui';

type hoverPopoverProps = {
  icon?: string;
  disabled?: boolean;
  color?: string;
  message: string;
};

export const HoverPopover = ({
  disabled = false,
  message,
  color = 'primary',
  icon = 'questionInCircle',
}: hoverPopoverProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Toggle functions
  const onMouseEnter = () => setIsPopoverOpen(true);
  const onMouseLeave = () => setIsPopoverOpen(false);
  const onFocus = () => setIsPopoverOpen(true);

  if (disabled) return null;

  const button = (
    <EuiIcon
      type={icon}
      color={color}
      size='l'
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      tabIndex={0}
      aria-label='Warning Info'
    />
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      anchorPosition='upCenter'
      panelPaddingSize='m'
    >
      <EuiText size='s' style={{ width: 200 }}>
        {message}
      </EuiText>
    </EuiPopover>
  );
};

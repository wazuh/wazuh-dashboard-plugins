import React, { useState } from 'react';
import { EuiPopover, EuiIcon, EuiText } from '@elastic/eui';

type hoverPopoverProps = {
  iconType?: string;
  isDisabled?: boolean;
  color?: string;
  message: string;
};

export const HoverPopover = ({
  isDisabled = false,
  message,
  color = 'primary',
  iconType = 'questionInCircle',
}: hoverPopoverProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Toggle functions
  const onMouseEnter = () => setIsPopoverOpen(true);
  const onMouseLeave = () => setIsPopoverOpen(false);
  const onFocus = () => setIsPopoverOpen(true);

  if (isDisabled) return null;

  const button = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 40,
        lineHeight: 0,
        paddingRight: 10,
      }}
    >
      <EuiIcon
        type={iconType}
        color={color}
        size='l'
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        tabIndex={0}
      />
    </span>
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      anchorPosition='downCenter'
      panelPaddingSize='m'
    >
      <EuiText size='s' style={{ width: 200 }}>
        {message}
      </EuiText>
    </EuiPopover>
  );
};

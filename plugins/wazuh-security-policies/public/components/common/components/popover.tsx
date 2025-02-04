import React, { useState } from 'react';
import { EuiButtonIcon, EuiPopover } from '@elastic/eui';

interface PopoverIconButtonProps {
  children?: React.ReactNode;
  styles?: React.CSSProperties;
  color?: string;
  icon?: string;
}

export const PopoverIconButton = (props: PopoverIconButtonProps) => {
  const { children, styles, color = 'text', icon = 'boxesVertical' } = props;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const onButtonClick = () => setIsPopoverOpen(isPopoverOpen => !isPopoverOpen);
  const closePopover = () => setIsPopoverOpen(false);

  return (
    <EuiPopover
      style={styles}
      ownFocus={false}
      button={
        <EuiButtonIcon
          color={color}
          onClick={onButtonClick}
          iconType={icon}
          aria-label='Options'
        />
      }
      isOpen={isPopoverOpen}
      closePopover={closePopover}
    >
      {children}
    </EuiPopover>
  );
};

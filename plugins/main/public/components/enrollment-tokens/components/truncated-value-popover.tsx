/*
 * Wazuh app - A long monospace value shown truncated, with a popover for the full text
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState } from 'react';
import {
  EuiButtonIcon,
  EuiCopy,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import './truncated-value-popover.scss';

interface TruncatedValuePopoverProps {
  value: string;
}

/**
 * A value too long to fit its row -- a token, a hash -- shown on one line
 * with an ellipsis instead of the plain overflow a monospace value gets by
 * default. Clicking it (a tooltip says so) opens a popover with the value in
 * full; only how much is shown at rest is cut, never the value itself. A
 * copy button sits next to it, since the popover only reads the value back,
 * it does not put it on the clipboard.
 */
export const TruncatedValuePopover = ({
  value,
}: TruncatedValuePopoverProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <EuiFlexGroup gutterSize='xs' alignItems='center' responsive={false}>
      <EuiFlexItem className='wz-truncated-value-popover-wrapper'>
        <EuiPopover
          button={
            <EuiToolTip content='Click to view the full value' position='top'>
              <code
                className='wz-truncated-value-popover'
                onClick={() => setIsPopoverOpen(true)}
              >
                {value}
              </code>
            </EuiToolTip>
          }
          isOpen={isPopoverOpen}
          closePopover={() => setIsPopoverOpen(false)}
          anchorPosition='downLeft'
        >
          <EuiText size='s' className='wz-truncated-value-popover__content'>
            {value}
          </EuiText>
        </EuiPopover>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiCopy textToCopy={value} beforeMessage='Copy to clipboard'>
          {copy => (
            <EuiButtonIcon
              iconType='copy'
              color='text'
              aria-label='Copy value'
              onClick={copy}
            />
          )}
        </EuiCopy>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

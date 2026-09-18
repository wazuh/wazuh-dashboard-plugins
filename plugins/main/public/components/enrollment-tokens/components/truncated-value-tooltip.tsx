/*
 * Wazuh app - A value shown truncated with an ellipsis, with a tooltip for the full text
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { EuiToolTip } from '@elastic/eui';
import './truncated-value-tooltip.scss';

interface TruncatedValueTooltipProps {
  value: string;
}

/**
 * An id, an address -- free-form text with no spaces to break on, so it
 * overflows its row instead of wrapping. Shown on one line with an ellipsis
 * instead, with the full value a hover away in a tooltip.
 */
export const TruncatedValueTooltip = ({
  value,
}: TruncatedValueTooltipProps) => (
  <div className='wz-truncated-value-tooltip-wrapper'>
    <EuiToolTip content={value} position='top'>
      <span className='wz-truncated-value-tooltip'>{value}</span>
    </EuiToolTip>
  </div>
);

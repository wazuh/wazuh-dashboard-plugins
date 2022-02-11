/*
 * Wazuh app - Inspect Logs Button Component
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */
import React from 'react';
import {
  EuiIcon,
  EuiButtonEmpty,
  EuiToolTip,
} from '@elastic/eui';

const InspectLogButton = ({ verboseIsOpen, switchVerboseDetails, haveLogs, shouldShowNotification }) => {

  const tooltipVerboseButton = `${verboseIsOpen ? 'Close' : 'Open'} details`;
  const LogButton = <EuiToolTip
    position='top'
    content={tooltipVerboseButton}
  >
    <EuiButtonEmpty size='xs' className={"wz-hover-transform-y1"} onClick={switchVerboseDetails} isDisabled={!haveLogs} textProps={{ style: { overflow: 'visible', position: 'relative' } }}>
      <EuiIcon
        aria-label={tooltipVerboseButton}
        type='inspect'
        color='primary'
      />
      {shouldShowNotification && (
        <EuiIcon
          style={{ position: 'absolute', top: '-3px', left: '10px' }}
          color='accent'
          type="dot"
          size='s'
        />
      )}
    </EuiButtonEmpty>
  </EuiToolTip>

  return LogButton;
}

export default InspectLogButton;
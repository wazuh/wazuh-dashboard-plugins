/*
 * Wazuh app - When the agent last reported the configuration shown.
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
import moment from 'moment-timezone';
import { EuiBadge, EuiToolTip } from '@elastic/eui';

import { formatUIDate } from '../../../../../../react-services/time-service';

export interface AgentReportBadgeProps {
  /** `state.modified_at` of the agent's document in wazuh-agent-config. */
  modifiedAt?: string;
}

/**
 * How old the configuration on screen is.
 *
 * This is when the agent last sent its configuration to the server, NOT when
 * the configuration was last changed: the agent reports on a fixed interval,
 * so an unchanged configuration is reported again and again. The wording says
 * "reported" for that reason -- "updated" or "modified" would read as a change
 * the user made.
 */
export const AgentReportBadge = ({ modifiedAt }: AgentReportBadgeProps) => {
  if (!modifiedAt) {
    return null;
  }

  return (
    <EuiToolTip
      position='left'
      content={
        <>
          <p>Sent by the agent on {formatUIDate(modifiedAt)}.</p>
          <p>
            Agents report on a set interval, so a change made since then appears
            after the next report.
          </p>
        </>
      }
    >
      <EuiBadge color='hollow' iconType='clock'>
        {`Reported ${moment(modifiedAt).fromNow()}`}
      </EuiBadge>
    </EuiToolTip>
  );
};

export default AgentReportBadge;

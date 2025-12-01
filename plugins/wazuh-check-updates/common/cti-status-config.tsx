import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { statusCodes } from './constants';

export const statusData = {
  [statusCodes.NOT_FOUND]: {
    color: 'warning',
    onClickAriaLabel: 'View pending to start CTI registration',
    message: () => (
      <FormattedMessage
        id='wazuhCheckUpdates.ctiRegistration.pending'
        defaultMessage='CTI Registration: Pending'
      />
    ),
  },
  [statusCodes.SUCCESS]: {
    color: 'success',
    onClickAriaLabel: 'View available CTI registration status',
    message: () => (
      <FormattedMessage
        id='wazuhCheckUpdates.ctiRegistration.available'
        defaultMessage='CTI Registration: {status}'
        values={{
          status: (
            <FormattedMessage
              id='wazuhCheckUpdates.ctiRegistration.statusModalStatusSuccess'
              defaultMessage='Success'
            />
          ),
        }}
      />
    ),
  },
} as const;

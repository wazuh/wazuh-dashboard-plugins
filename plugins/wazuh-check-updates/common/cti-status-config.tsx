import React from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { statusCodes } from './constants';

export const statusData = {
  [statusCodes.NOT_FOUND]: {
    color: 'warning',
    onClickAriaLabel: i18n.translate(
      'wazuhCheckUpdates.ctiRegistration.statusAriaLabel.pending',
      { defaultMessage: 'View pending to start CTI registration' },
    ),
    message: () => (
      <FormattedMessage
        id='wazuhCheckUpdates.ctiRegistration.pending'
        defaultMessage='CTI Registration: Pending'
      />
    ),
  },
  [statusCodes.SUCCESS]: {
    color: 'success',
    onClickAriaLabel: i18n.translate(
      'wazuhCheckUpdates.ctiRegistration.statusAriaLabel.available',
      { defaultMessage: 'View available CTI registration status' },
    ),
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
  [statusCodes.REGISTRATION_FAILED]: {
    color: 'danger',
    onClickAriaLabel: i18n.translate(
      'wazuhCheckUpdates.ctiRegistration.statusAriaLabel.failed',
      { defaultMessage: 'CTI registration failed' },
    ),
    message: () => (
      <FormattedMessage
        id='wazuhCheckUpdates.ctiRegistration.failedNav'
        defaultMessage='CTI Registration: Failed'
      />
    ),
  },
} as const;

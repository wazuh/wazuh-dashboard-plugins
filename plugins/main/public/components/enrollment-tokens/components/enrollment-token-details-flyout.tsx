/*
 * Wazuh app - Flyout with the full detail of one enrollment token
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
import {
  EuiButtonEmpty,
  EuiDescriptionList,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiHealth,
  EuiFlyoutHeader,
  EuiTitle,
} from '@elastic/eui';
import { WzFlyout } from '../../common/flyouts';
import { formatUIDate } from '../../../react-services/time-service';
import { EnrollmentTokenSummary } from '../../../services/enrollment-tokens';
import {
  ENROLLMENT_TOKEN_STATUS_LABEL,
  getEnrollmentTokenStatus,
} from '../utils/token-status';
import { formatEnrollmentsUsage } from '../utils/format-enrollments-usage';
import { TruncatedValueTooltip } from './truncated-value-tooltip';

interface EnrollmentTokenDetailsFlyoutProps {
  token: EnrollmentTokenSummary;
  onClose: () => void;
}

/* The columns keep to what tells the tokens apart and how they are doing;
everything else -- id, address, the raw dates, how many enrollments are left,
whether it carries a credential -- moves here rather than crowding the row. */
export const EnrollmentTokenDetailsFlyout = ({
  token,
  onClose,
}: EnrollmentTokenDetailsFlyoutProps) => {
  const { label, color } =
    ENROLLMENT_TOKEN_STATUS_LABEL[getEnrollmentTokenStatus(token)];

  return (
    <WzFlyout
      onClose={onClose}
      flyoutProps={{
        size: 's',
        'aria-labelledby': 'enrollmentTokenDetailsFlyoutTitle',
      }}
    >
      <EuiFlyoutHeader hasBorder={false}>
        <EuiTitle size='m'>
          <h2 id='enrollmentTokenDetailsFlyoutTitle'>
            Enrollment token details
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiDescriptionList
          compressed
          type='column'
          listItems={[
            {
              title: 'ID',
              description: token.id ? (
                <TruncatedValueTooltip value={token.id} />
              ) : (
                '-'
              ),
            },
            {
              title: 'Address',
              description: token.address ? (
                <TruncatedValueTooltip value={token.address} />
              ) : (
                '-'
              ),
            },
            {
              title: 'Description',
              description: token.description ? (
                <TruncatedValueTooltip value={token.description} />
              ) : (
                '-'
              ),
            },
            {
              title: 'Status',
              description: <EuiHealth color={color}>{label}</EuiHealth>,
            },
            { title: 'Created', description: formatUIDate(token.created) },
            { title: 'Expires', description: formatUIDate(token.expires) },
            {
              title: 'Enrollments',
              description: formatEnrollmentsUsage(token),
            },
            {
              title: 'Credential',
              description: token.credential === false ? 'No' : 'Yes',
            },
          ]}
        />
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiButtonEmpty iconType='cross' onClick={onClose} flush='left'>
          Close
        </EuiButtonEmpty>
      </EuiFlyoutFooter>
    </WzFlyout>
  );
};

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

import { i18n } from '@osd/i18n';
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
import './enrollment-token-details-flyout.scss';
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
            {i18n.translate(
              'wazuh.enrollmentTokens.enrollmentTokenDetailsFlyout.title',
              {
                defaultMessage: 'Enrollment token details',
              },
            )}
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        {/* Stacked rather than in two columns: an id, an address or a
        description is free-form text, and a label column beside it leaves too
        little room to read one. Each value gets the width of the flyout
        instead, under its own label. */}
        <EuiDescriptionList
          compressed
          type='row'
          listItems={[
            {
              title: i18n.translate(
                'wazuh.enrollmentTokens.enrollmentTokenDetailsFlyout.idLabel',
                {
                  defaultMessage: 'ID',
                },
              ),
              description: token.id ? (
                <TruncatedValueTooltip value={token.id} />
              ) : (
                '-'
              ),
            },
            {
              title: i18n.translate(
                'wazuh.enrollmentTokens.enrollmentTokenDetailsFlyout.addressLabel',
                {
                  defaultMessage: 'Address',
                },
              ),
              description: token.address ? (
                <TruncatedValueTooltip value={token.address} />
              ) : (
                '-'
              ),
            },
            {
              /* Prose, not an opaque identifier: it is shown whole, wrapped
              over as many lines as it takes, rather than cut to one line with
              the rest behind a tooltip. */
              title: i18n.translate(
                'wazuh.enrollmentTokens.enrollmentTokenDetailsFlyout.descriptionLabel',
                {
                  defaultMessage: 'Description',
                },
              ),
              description: token.description ? (
                <span className='wz-enrollment-token-description'>
                  {token.description}
                </span>
              ) : (
                '-'
              ),
            },
            {
              title: i18n.translate(
                'wazuh.enrollmentTokens.enrollmentTokenDetailsFlyout.statusLabel',
                {
                  defaultMessage: 'Status',
                },
              ),
              description: <EuiHealth color={color}>{label}</EuiHealth>,
            },
            {
              title: i18n.translate(
                'wazuh.enrollmentTokens.enrollmentTokenDetailsFlyout.createdLabel',
                {
                  defaultMessage: 'Created',
                },
              ),
              description: formatUIDate(token.created),
            },
            {
              title: i18n.translate(
                'wazuh.enrollmentTokens.enrollmentTokenDetailsFlyout.expiresLabel',
                {
                  defaultMessage: 'Expires',
                },
              ),
              description: formatUIDate(token.expires),
            },
            {
              title: i18n.translate(
                'wazuh.enrollmentTokens.enrollmentTokenDetailsFlyout.enrollmentsLabel',
                {
                  defaultMessage: 'Enrollments',
                },
              ),
              description: formatEnrollmentsUsage(token),
            },
            {
              title: i18n.translate(
                'wazuh.enrollmentTokens.enrollmentTokenDetailsFlyout.credentialLabel',
                {
                  defaultMessage: 'Credential',
                },
              ),
              description:
                token.credential === false
                  ? i18n.translate(
                      'wazuh.enrollmentTokens.enrollmentTokenDetailsFlyout.credentialNo',
                      {
                        defaultMessage: 'No',
                      },
                    )
                  : i18n.translate(
                      'wazuh.enrollmentTokens.enrollmentTokenDetailsFlyout.credentialYes',
                      {
                        defaultMessage: 'Yes',
                      },
                    ),
            },
          ]}
        />
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiButtonEmpty iconType='cross' onClick={onClose} flush='left'>
          {i18n.translate(
            'wazuh.enrollmentTokens.enrollmentTokenDetailsFlyout.closeButton',
            {
              defaultMessage: 'Close',
            },
          )}
        </EuiButtonEmpty>
      </EuiFlyoutFooter>
    </WzFlyout>
  );
};

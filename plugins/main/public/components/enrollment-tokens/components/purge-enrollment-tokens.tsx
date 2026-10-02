/*
 * Wazuh app - Purge the enrollment tokens the manager stores
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
import React, { useState } from 'react';
import {
  EuiConfirmModal,
  EuiOverlayMask,
  EuiRadioGroup,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { WzButtonPermissions } from '../../common/permissions/button';
import {
  EnrollmentTokenPurgeStatus,
  purgeEnrollmentTokens,
} from '../../../services/enrollment-tokens';
import { ErrorHandler } from '../../../react-services/error-handler';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import {
  UI_ERROR_SEVERITIES,
  UILogLevel,
} from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';

interface PurgeEnrollmentTokensProps {
  onPurged: () => void;
}

const PURGE_OPTIONS = [
  {
    id: 'dead',
    label: i18n.translate(
      'wazuh.enrollmentTokens.purgeEnrollmentTokens.deadOption',
      {
        defaultMessage: 'Dead tokens only',
      },
    ),
  },
  {
    id: 'all',
    label: i18n.translate(
      'wazuh.enrollmentTokens.purgeEnrollmentTokens.allOption',
      {
        defaultMessage: 'Every token, the usable ones included',
      },
    ),
  },
];

export const PurgeEnrollmentTokens = ({
  onPurged,
}: PurgeEnrollmentTokensProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [status, setStatus] = useState<EnrollmentTokenPurgeStatus>('dead');

  const onConfirm = async () => {
    setIsPurging(true);
    try {
      const purged = await purgeEnrollmentTokens(status);

      setIsModalVisible(false);
      ErrorHandler.info(
        i18n.translate(
          'wazuh.enrollmentTokens.purgeEnrollmentTokens.successToast',
          {
            defaultMessage:
              '{count, plural, one {{count} enrollment token was purged} other {{count} enrollment tokens were purged}}',
            values: { count: purged.length },
          },
        ),
      );
      onPurged();
    } catch (error) {
      getErrorOrchestrator().handleError({
        context: `${PurgeEnrollmentTokens.name}.onConfirm`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error,
          message: error.message || String(error),
          title: error.name,
        },
      });
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <>
      <WzButtonPermissions
        buttonType='empty'
        permissions={[{ action: 'enrollment_token:delete', resource: '*:*:*' }]}
        iconType='trash'
        color='danger'
        onClick={() => setIsModalVisible(true)}
      >
        {i18n.translate(
          'wazuh.enrollmentTokens.purgeEnrollmentTokens.openButton',
          {
            defaultMessage: 'Purge tokens',
          },
        )}
      </WzButtonPermissions>
      {isModalVisible && (
        <EuiOverlayMask>
          <EuiConfirmModal
            title={i18n.translate(
              'wazuh.enrollmentTokens.purgeEnrollmentTokens.modalTitle',
              {
                defaultMessage: 'Purge enrollment tokens',
              },
            )}
            onCancel={() => setIsModalVisible(false)}
            onConfirm={onConfirm}
            cancelButtonText={i18n.translate(
              'wazuh.enrollmentTokens.purgeEnrollmentTokens.cancelButton',
              {
                defaultMessage: 'Cancel',
              },
            )}
            confirmButtonText={i18n.translate(
              'wazuh.enrollmentTokens.purgeEnrollmentTokens.confirmButton',
              {
                defaultMessage: 'Purge',
              },
            )}
            confirmButtonDisabled={isPurging}
            isLoading={isPurging}
            buttonColor='danger'
            defaultFocusedButton='cancel'
          >
            <EuiText size='s'>
              <p>
                {i18n.translate(
                  'wazuh.enrollmentTokens.purgeEnrollmentTokens.modalBody',
                  {
                    defaultMessage:
                      'Purging removes the tokens from the manager store. This is not the same as revoking one: a revoked token stays in the listing, a purged one is gone.',
                  },
                )}
              </p>
            </EuiText>
            <EuiSpacer size='m' />
            <EuiRadioGroup
              options={PURGE_OPTIONS}
              idSelected={status}
              onChange={id => setStatus(id as EnrollmentTokenPurgeStatus)}
              name='enrollmentTokensPurgeStatus'
            />
            <EuiSpacer size='s' />
            <EuiText size='xs' color='subdued'>
              {i18n.translate(
                'wazuh.enrollmentTokens.purgeEnrollmentTokens.statusHelp',
                {
                  defaultMessage:
                    '{status, select, dead {Only the tokens that can no longer authorise an enrollment are removed: revoked, expired or out of uses. A usable token is never touched.} other {The store is emptied. Agents that have not enrolled yet with a token still in use will no longer be able to.}}',
                  values: { status },
                },
              )}
            </EuiText>
          </EuiConfirmModal>
        </EuiOverlayMask>
      )}
    </>
  );
};

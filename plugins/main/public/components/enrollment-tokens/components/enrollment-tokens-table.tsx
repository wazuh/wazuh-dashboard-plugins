/*
 * Wazuh app - Table of the enrollment tokens the manager has minted
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
  CriteriaWithPagination,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiTableSortingType,
  EuiToolTip,
} from '@elastic/eui';
import { WzButtonPermissionsModalConfirm } from '../../common/buttons';
import { formatUIDate } from '../../../react-services/time-service';
import {
  EnrollmentTokenSummary,
  revokeEnrollmentToken,
} from '../../../services/enrollment-tokens';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import {
  UI_ERROR_SEVERITIES,
  UILogLevel,
} from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { ErrorHandler } from '../../../react-services/error-handler';
import { truncateDescription } from '../utils/truncate-description';
import { formatTimeRemaining } from '../utils/format-time-remaining';
import {
  ENROLLMENT_TOKEN_STATUS_LABEL,
  getEnrollmentTokenStatus,
} from '../utils/token-status';
import { EnrollmentTokenDetailsFlyout } from './enrollment-token-details-flyout';

interface EnrollmentTokensTableProps {
  tokens: EnrollmentTokenSummary[];
  loading: boolean;
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  onTableChange: (
    criteria: CriteriaWithPagination<EnrollmentTokenSummary>,
  ) => void;
  sorting: EuiTableSortingType<EnrollmentTokenSummary>;
  onRevoked: () => void;
}

export const EnrollmentTokensTable = ({
  tokens,
  loading,
  pageIndex,
  pageSize,
  totalItems,
  onTableChange,
  sorting,
  onRevoked,
}: EnrollmentTokensTableProps) => {
  const [viewingToken, setViewingToken] =
    useState<EnrollmentTokenSummary | null>(null);

  const onConfirmRevokeToken = (token: EnrollmentTokenSummary) => async () => {
    try {
      await revokeEnrollmentToken(String(token.id));
      ErrorHandler.info('Enrollment token was successfully revoked');
      onRevoked();
    } catch (error) {
      getErrorOrchestrator().handleError({
        context: `${EnrollmentTokensTable.name}.onConfirmRevokeToken`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error,
          message: error.message || String(error),
          title: error.name,
        },
      });
    }
  };

  const columns: EuiBasicTableColumn<EnrollmentTokenSummary>[] = [
    {
      name: 'Status',
      render: (token: EnrollmentTokenSummary) => {
        const { label, color } =
          ENROLLMENT_TOKEN_STATUS_LABEL[getEnrollmentTokenStatus(token)];

        return <EuiHealth color={color}>{label}</EuiHealth>;
      },
    },
    {
      field: 'created',
      name: 'Created',
      sortable: true,
      render: (created?: string) => formatUIDate(created),
    },
    {
      field: 'description',
      name: 'Description',
      render: (description?: string | null) => {
        if (!description) {
          return '-';
        }

        const truncated = truncateDescription(description);

        // Only pay for the tooltip anchor when the text was actually cut,
        // so an already-short description renders as plain text.
        return truncated === description ? (
          truncated
        ) : (
          <EuiToolTip content={description}>
            <span>{truncated}</span>
          </EuiToolTip>
        );
      },
    },
    {
      field: 'expires',
      name: 'Expires',
      sortable: true,
      // The exact expiry stays one hover away rather than gone: the relative
      // form answers "do I need to act on this", the tooltip answers "when,
      // exactly".
      render: (expires?: string) => (
        <EuiToolTip content={formatUIDate(expires)}>
          <span>{formatTimeRemaining(expires)}</span>
        </EuiToolTip>
      ),
    },
    {
      align: 'right',
      width: '90',
      name: 'Actions',
      render: (token: EnrollmentTokenSummary) => (
        <EuiFlexGroup responsive={false} gutterSize='none'>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              iconType='inspect'
              color='text'
              aria-label='View enrollment token details'
              onClick={() => setViewingToken(token)}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <WzButtonPermissionsModalConfirm
              buttonType='icon'
              permissions={[
                { action: 'enrollment_token:delete', resource: '*:*:*' },
              ]}
              tooltip={{
                content: token.revoked
                  ? 'The token is already revoked'
                  : 'Revoke token',
                position: 'left',
              }}
              isDisabled={token.revoked}
              modalTitle='Do you want to revoke the enrollment token?'
              modalProps={{ buttonColor: 'danger' }}
              onConfirm={onConfirmRevokeToken(token)}
              iconType='trash'
              color='danger'
              aria-label='Revoke enrollment token'
              modalCancelText='Cancel'
              modalConfirmText='Confirm'
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
  ];

  const pagination = {
    pageIndex,
    pageSize,
    totalItemCount: totalItems,
    pageSizeOptions: [10, 25, 50],
    showPerPageOptions: true,
  };

  return (
    <>
      <EuiBasicTable
        items={tokens}
        itemId='id'
        columns={columns}
        pagination={pagination}
        onChange={onTableChange}
        loading={loading}
        sorting={sorting}
        noItemsMessage='No enrollment tokens were minted'
      />
      {viewingToken && (
        <EnrollmentTokenDetailsFlyout
          token={viewingToken}
          onClose={() => setViewingToken(null)}
        />
      )}
    </>
  );
};

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

import { i18n } from '@osd/i18n';
import React, { useState } from 'react';
import {
  CriteriaWithPagination,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCheckboxGroup,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiIcon,
  EuiSpacer,
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
import { formatEnrollmentsUsage } from '../utils/format-enrollments-usage';
import { formatTimeRemaining } from '../utils/format-time-remaining';
import {
  ENROLLMENT_TOKEN_STATUS_LABEL,
  getEnrollmentTokenStatus,
} from '../utils/token-status';
import { EnrollmentTokenDetailsFlyout } from './enrollment-token-details-flyout';
import { useStateStorage } from '../../common/hooks';
import './enrollment-tokens-table.scss';

/* Every column the operator can turn on. The id is what the selector checks
off and what is remembered between visits, and it is kept apart from the EUI
column definition because two of these render from the whole row rather than
from a single field, so they carry no `field` to be identified by. */
interface SelectableColumn {
  id: string;
  name: string;
  column: EuiBasicTableColumn<EnrollmentTokenSummary>;
}

/* What the table shows until the operator says otherwise. The rest -- the id,
the address and whether the token carries a credential -- answer questions that
only come up occasionally, so they start out of the way. */
const DEFAULT_VISIBLE_COLUMNS = [
  'status',
  'created',
  'description',
  'uses',
  'expires',
  'actions',
];

const VISIBLE_COLUMNS_STORAGE_KEY = 'wz-enrollment-tokens-visible-columns';

interface EnrollmentTokensTableProps {
  tokens: EnrollmentTokenSummary[];
  /* The term the listing is filtered by. It is held by the page because it is
  the page that re-reads the listing, and rendered here because it belongs with
  the rest of the table's toolbar. */
  searchTerm: string;
  onSearch: (term: string) => void;
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
  searchTerm,
  onSearch,
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
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  /* Remembered per browser: the choice is about how this operator reads the
  table, not about the tokens, so it outlives the visit. */
  const [visibleColumns, setVisibleColumns] = useStateStorage(
    DEFAULT_VISIBLE_COLUMNS,
    'localStorage',
    VISIBLE_COLUMNS_STORAGE_KEY,
  );

  /* Unchecking the last column would leave a table with no columns at all and
  no way to get one back, so the last one standing ignores the click. */
  const onToggleColumn = (columnId: string) =>
    setVisibleColumns((current: string[]) =>
      current.includes(columnId)
        ? current.length > 1
          ? current.filter(id => id !== columnId)
          : current
        : [...current, columnId],
    );

  const onConfirmRevokeToken = (token: EnrollmentTokenSummary) => async () => {
    try {
      await revokeEnrollmentToken(String(token.id));
      ErrorHandler.info(
        i18n.translate(
          'wazuh.enrollmentTokens.enrollmentTokensTable.revokeSuccess',
          {
            defaultMessage: 'Enrollment token was successfully revoked',
          },
        ),
      );
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

  /* Each name is both the column header and its entry in the column
  selector. */
  const columnNames = {
    status: i18n.translate(
      'wazuh.enrollmentTokens.enrollmentTokensTable.columns.status',
      {
        defaultMessage: 'Status',
      },
    ),
    id: i18n.translate(
      'wazuh.enrollmentTokens.enrollmentTokensTable.columns.id',
      {
        defaultMessage: 'ID',
      },
    ),
    address: i18n.translate(
      'wazuh.enrollmentTokens.enrollmentTokensTable.columns.address',
      {
        defaultMessage: 'Address',
      },
    ),
    created: i18n.translate(
      'wazuh.enrollmentTokens.enrollmentTokensTable.columns.created',
      {
        defaultMessage: 'Created',
      },
    ),
    description: i18n.translate(
      'wazuh.enrollmentTokens.enrollmentTokensTable.columns.description',
      {
        defaultMessage: 'Description',
      },
    ),
    uses: i18n.translate(
      'wazuh.enrollmentTokens.enrollmentTokensTable.columns.uses',
      {
        defaultMessage: 'Uses',
      },
    ),
    credential: i18n.translate(
      'wazuh.enrollmentTokens.enrollmentTokensTable.columns.credential',
      {
        defaultMessage: 'Credential',
      },
    ),
    expires: i18n.translate(
      'wazuh.enrollmentTokens.enrollmentTokensTable.columns.expires',
      {
        defaultMessage: 'Expires',
      },
    ),
    actions: i18n.translate(
      'wazuh.enrollmentTokens.enrollmentTokensTable.columns.actions',
      {
        defaultMessage: 'Actions',
      },
    ),
  };

  const selectableColumns: SelectableColumn[] = [
    {
      id: 'status',
      name: columnNames.status,
      column: {
        name: columnNames.status,
        render: (token: EnrollmentTokenSummary) => {
          const { label, color } =
            ENROLLMENT_TOKEN_STATUS_LABEL[getEnrollmentTokenStatus(token)];

          return <EuiHealth color={color}>{label}</EuiHealth>;
        },
      },
    },
    {
      id: 'id',
      name: columnNames.id,
      column: {
        field: 'id',
        name: columnNames.id,
        sortable: true,
        render: (id?: string) => id ?? '-',
      },
    },
    {
      id: 'address',
      name: columnNames.address,
      column: {
        field: 'address',
        name: columnNames.address,
        sortable: true,
        render: (address?: string) => address ?? '-',
      },
    },
    {
      id: 'created',
      name: columnNames.created,
      column: {
        field: 'created',
        name: columnNames.created,
        sortable: true,
        render: (created?: string) => formatUIDate(created),
      },
    },
    {
      id: 'description',
      name: columnNames.description,
      column: {
        field: 'description',
        name: columnNames.description,
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
    },
    {
      id: 'uses',
      name: columnNames.uses,
      column: {
        field: 'uses',
        name: columnNames.uses,
        /* Read against the allowance beside it, which is what says whether the
        token is running out. Sorting is on the use count alone -- the manager
        orders by a field, and "how close to exhausted" is not one. */
        sortable: true,
        render: (_uses: number | undefined, token: EnrollmentTokenSummary) =>
          formatEnrollmentsUsage(token),
      },
    },
    {
      id: 'credential',
      name: columnNames.credential,
      column: {
        field: 'credential',
        name: columnNames.credential,
        sortable: true,
        /* A token minted with `no_credential` carries the address and the pin
        only: it can point an agent at the manager but cannot authenticate its
        enrollment, which is the whole of what this column reports. */
        render: (credential?: boolean) =>
          credential
            ? i18n.translate(
                'wazuh.enrollmentTokens.enrollmentTokensTable.credentialYes',
                {
                  defaultMessage: 'Yes',
                },
              )
            : i18n.translate(
                'wazuh.enrollmentTokens.enrollmentTokensTable.credentialNo',
                {
                  defaultMessage: 'No',
                },
              ),
      },
    },
    {
      id: 'expires',
      name: columnNames.expires,
      column: {
        field: 'expires',
        name: columnNames.expires,
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
    },
    {
      id: 'actions',
      name: columnNames.actions,
      column: {
        align: 'right',
        width: '90',
        name: columnNames.actions,
        render: (token: EnrollmentTokenSummary) => (
          <EuiFlexGroup responsive={false} gutterSize='none'>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType='inspect'
                color='text'
                aria-label={i18n.translate(
                  'wazuh.enrollmentTokens.enrollmentTokensTable.viewDetailsAriaLabel',
                  {
                    defaultMessage: 'View enrollment token details',
                  },
                )}
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
                    ? i18n.translate(
                        'wazuh.enrollmentTokens.enrollmentTokensTable.alreadyRevokedTooltip',
                        {
                          defaultMessage: 'The token is already revoked',
                        },
                      )
                    : i18n.translate(
                        'wazuh.enrollmentTokens.enrollmentTokensTable.revokeTooltip',
                        {
                          defaultMessage: 'Revoke token',
                        },
                      ),
                  position: 'left',
                }}
                isDisabled={token.revoked}
                modalTitle={i18n.translate(
                  'wazuh.enrollmentTokens.enrollmentTokensTable.revokeModalTitle',
                  {
                    defaultMessage:
                      'Do you want to revoke the enrollment token?',
                  },
                )}
                modalProps={{ buttonColor: 'danger' }}
                onConfirm={onConfirmRevokeToken(token)}
                iconType='cross'
                color='danger'
                aria-label={i18n.translate(
                  'wazuh.enrollmentTokens.enrollmentTokensTable.revokeAriaLabel',
                  {
                    defaultMessage: 'Revoke enrollment token',
                  },
                )}
                modalCancelText={i18n.translate(
                  'wazuh.enrollmentTokens.enrollmentTokensTable.revokeModalCancel',
                  {
                    defaultMessage: 'Cancel',
                  },
                )}
                modalConfirmText={i18n.translate(
                  'wazuh.enrollmentTokens.enrollmentTokensTable.revokeModalConfirm',
                  {
                    defaultMessage: 'Confirm',
                  },
                )}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        ),
      },
    },
  ];

  /* The columns are rendered in the order they are declared above, not in the
  order they were checked off, so turning one on puts it back where it belongs
  rather than at the end. */
  const columns = selectableColumns
    .filter(({ id }) => visibleColumns.includes(id))
    .map(({ column }) => column);

  const pagination = {
    pageIndex,
    pageSize,
    totalItemCount: totalItems,
    pageSizeOptions: [10, 25, 50],
    showPerPageOptions: true,
  };

  const selectColumnsLabel = i18n.translate(
    'wazuh.enrollmentTokens.enrollmentTokensTable.selectColumns',
    {
      defaultMessage: 'Select visible columns',
    },
  );

  return (
    <>
      <EuiFlexGroup gutterSize='s' alignItems='center' responsive={false}>
        <EuiFlexItem>
          <EuiFieldSearch
            fullWidth
            placeholder={i18n.translate(
              'wazuh.enrollmentTokens.enrollmentTokensTable.searchPlaceholder',
              {
                defaultMessage: 'Search by description, ID or address',
              },
            )}
            aria-label={i18n.translate(
              'wazuh.enrollmentTokens.enrollmentTokensTable.searchAriaLabel',
              {
                defaultMessage: 'Search enrollment tokens',
              },
            )}
            defaultValue={searchTerm}
            isClearable
            onSearch={onSearch}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiToolTip content={selectColumnsLabel} position='left'>
            <EuiButtonEmpty
              aria-label={selectColumnsLabel}
              aria-expanded={isColumnSelectorOpen}
              onClick={() => setIsColumnSelectorOpen(open => !open)}
            >
              <EuiIcon type='managementApp' color='primary' />
            </EuiButtonEmpty>
          </EuiToolTip>
        </EuiFlexItem>
      </EuiFlexGroup>
      {isColumnSelectorOpen && (
        <EuiCheckboxGroup
          className='enrollmentTokensColumnSelector'
          idToSelectedMap={{}}
          options={selectableColumns.map(({ id, name }) => ({
            id,
            label: name,
            checked: visibleColumns.includes(id),
          }))}
          onChange={onToggleColumn}
        />
      )}
      <EuiSpacer size='s' />
      <EuiBasicTable
        items={tokens}
        itemId='id'
        columns={columns}
        pagination={pagination}
        onChange={onTableChange}
        loading={loading}
        sorting={sorting}
        noItemsMessage={i18n.translate(
          'wazuh.enrollmentTokens.enrollmentTokensTable.noItems',
          {
            defaultMessage: 'No enrollment tokens were minted',
          },
        )}
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

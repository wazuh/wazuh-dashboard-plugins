/*
 * Wazuh app - Enrollment tokens listing
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTableSortingType,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { WzButtonPermissions } from '../common/permissions/button';
import { usePagination } from '../common/hooks/usePagination';
import {
  EnrollmentTokenSummary,
  getEnrollmentTokens,
} from '../../services/enrollment-tokens';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import {
  UI_ERROR_SEVERITIES,
  UILogLevel,
} from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { EnrollmentTokensTable } from './components/enrollment-tokens-table';
import { CreateEnrollmentTokenFlyout } from './components/create-enrollment-token-flyout';
import { PurgeEnrollmentTokens } from './components/purge-enrollment-tokens';

export const EnrollmentTokens = () => {
  const [isCreateFlyoutVisible, setIsCreateFlyoutVisible] = useState(false);
  /* The term the manager is filtering on, not what is being typed: the listing
  is re-read on submit rather than on every keystroke. */
  const [searchTerm, setSearchTerm] = useState('');

  const handlePaginationError = (error: Error) => {
    getErrorOrchestrator().handleError({
      context: `${EnrollmentTokens.name}.getData`,
      level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      error: {
        error,
        message: error.message || String(error),
        title: error.name,
      },
    });
  };

  /* `usePagination` calls its fetch function with the offset, the limit and the
  sort, so the term rides in through the closure. */
  const fetchTokens = useCallback(
    (offset: number, limit: number, sort?: string) =>
      getEnrollmentTokens(offset, limit, sort, searchTerm),
    [searchTerm],
  );

  const {
    items: tokens,
    loading,
    pageIndex,
    pageSize,
    totalItems,
    getData,
    refreshCurrentPage,
    onTableChange,
    sorting,
  } = usePagination<EnrollmentTokenSummary>(
    fetchTokens,
    handlePaginationError,
    /* Newest first: an operator comes here right after minting a token, so the
    one they are looking for is the one at the top. */
    { field: 'created', direction: 'desc' },
  );

  useEffect(() => {
    /* A new term starts from the first page: the page the operator was on may
    not exist in the filtered result. */
    getData(0, pageSize);
    /* `getData` is rebuilt on every render -- it closes over the sort state and
    over this component's error handler -- so listing it here would refetch in a
    loop. The listing is read on mount and whenever the term changes. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  /* A purge or a revoke can empty the page the table is on, so the listing is
  read back from the first page rather than from the current one. */
  const reload = () => getData(0, pageSize);

  return (
    <EuiPageContent>
      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle>
            <h2>Enrollment tokens</h2>
          </EuiTitle>
          <EuiText size='s' color='subdued'>
            Credentials an agent uses to enroll with the manager. The token text
            can only be read at the moment it is created; it is never shown
            again afterwards.
          </EuiText>
        </EuiPageContentHeaderSection>
        <EuiPageContentHeaderSection>
          <EuiFlexGroup gutterSize='s' alignItems='center' responsive={false}>
            <EuiFlexItem grow={false}>
              <PurgeEnrollmentTokens onPurged={reload} />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <WzButtonPermissions
                permissions={[
                  { action: 'enrollment_token:create', resource: '*:*:*' },
                ]}
                iconType='plusInCircle'
                fill
                onClick={() => setIsCreateFlyoutVisible(true)}
              >
                Create token
              </WzButtonPermissions>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>
      <EuiPageContentBody>
        <EnrollmentTokensTable
          tokens={tokens}
          /* The manager's own free-text filter over the whole collection, so it
          reaches tokens that are not on the page in hand. It is not restricted
          to the description: the collection offers no per-field substring
          filter. */
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          loading={loading}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalItems={totalItems}
          onTableChange={onTableChange}
          sorting={sorting as EuiTableSortingType<EnrollmentTokenSummary>}
          onRevoked={refreshCurrentPage}
        />
      </EuiPageContentBody>
      {isCreateFlyoutVisible && (
        <CreateEnrollmentTokenFlyout
          onClose={minted => {
            setIsCreateFlyoutVisible(false);
            if (minted) {
              reload();
            }
          }}
        />
      )}
    </EuiPageContent>
  );
};

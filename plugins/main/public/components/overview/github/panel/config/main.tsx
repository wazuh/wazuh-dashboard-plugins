/*
 * Wazuh app - GitHub Panel tab - Main layout configuration
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
import { AggTable } from '../../../../common/modules/panel';
import { EuiFlexItem } from '@elastic/eui';
import { ModuleConfigProps } from './module-config';

export const MainViewConfig = (props: ModuleConfigProps) => {
  const { fetchFilters, searchBarProps, indexPattern } = props;

  const searchParams = {
    filters: fetchFilters,
    indexPattern,
    query: searchBarProps.query,
    dateRange: {
      from: searchBarProps.dateRangeFrom || '',
      to: searchBarProps.dateRangeTo || '',
    },
  };

  return {
    rows: [
      {
        columns: [
          {
            width: 50,
            component: props => (
              <EuiFlexItem grow={props.width}>
                <AggTable
                  tableTitle={i18n.translate('wazuh.github.actorsTable.title', {
                    defaultMessage: 'Actors',
                  })}
                  aggTerm='user.name'
                  aggLabel={i18n.translate('wazuh.github.actorsTable.column', {
                    defaultMessage: 'Actor',
                  })}
                  maxRows={5}
                  onRowClick={props.onRowClick}
                  searchParams={searchParams}
                />
              </EuiFlexItem>
            ),
          },
          {
            width: 50,
            component: props => (
              <EuiFlexItem grow={props.width}>
                <AggTable
                  tableTitle={i18n.translate(
                    'wazuh.github.organizationsTable.title',
                    {
                      defaultMessage: 'Organizations',
                    },
                  )}
                  aggTerm='organization.name'
                  aggLabel={i18n.translate(
                    'wazuh.github.organizationsTable.column',
                    {
                      defaultMessage: 'Organization',
                    },
                  )}
                  maxRows={5}
                  onRowClick={props.onRowClick}
                  searchParams={searchParams}
                />
              </EuiFlexItem>
            ),
          },
        ],
      },
      {
        columns: [
          {
            width: 50,
            component: props => (
              <EuiFlexItem grow={props.width}>
                <AggTable
                  tableTitle={i18n.translate(
                    'wazuh.github.repositoriesTable.title',
                    {
                      defaultMessage: 'Repositories',
                    },
                  )}
                  aggTerm='url.original'
                  aggLabel={i18n.translate(
                    'wazuh.github.repositoriesTable.column',
                    {
                      defaultMessage: 'Repository',
                    },
                  )}
                  maxRows={5}
                  onRowClick={props.onRowClick}
                  searchParams={searchParams}
                />
              </EuiFlexItem>
            ),
          },
          {
            width: 50,
            component: props => (
              <EuiFlexItem grow={props.width}>
                <AggTable
                  tableTitle={i18n.translate(
                    'wazuh.github.actionsTable.title',
                    {
                      defaultMessage: 'Actions',
                    },
                  )}
                  aggTerm='event.action'
                  aggLabel={i18n.translate('wazuh.github.actionsTable.column', {
                    defaultMessage: 'Action',
                  })}
                  maxRows={5}
                  onRowClick={props.onRowClick}
                  searchParams={searchParams}
                />
              </EuiFlexItem>
            ),
          },
        ],
      },
    ],
  };
};

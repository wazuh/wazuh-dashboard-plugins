/*
 * Wazuh app - Registry values components
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { EuiBasicTableColumn, EuiInMemoryTable, SortDirection } from '@elastic/eui';
import { WzRequest } from '../../../../../react-services';
import React, { useEffect, useState } from 'react';
import valuesMock from './values.json';
import { DIRECTIONS } from '@elastic/eui/src/components/flex/flex_group';

export const RegistryValues = (props) => {
  const [values, setValues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>();

  useEffect(() => {
    getValues().then(() => setIsLoading(false));
  }, []);

  const getValues = async () => {
    const { agent, currentFile } = props;
    try {
      const values = await WzRequest.apiReq('GET', `/syscheck/${agent.id}`, {
        params: {
          q: `type=registry_value;file=${encodeURIComponent(currentFile.file).replaceAll(
            '%5C',
            '\\\\'
          )}`,
          sort: '-date',
        },
      });

      setValues((((values || {}).data || {}).data || {}).affected_items || []);
    } catch (error) {
      setError(error);
    }
  };

  const columns: EuiBasicTableColumn<any>[] = [
    {
      field: 'date',
      name: 'Date',
      sortable: true,
    },
    {
      field: 'value',
      name: 'Value name',
      sortable: true,
      render: (item) => item.name,
    },
    {
      field: 'value',
      name: 'Value type',
      sortable: true,
      render: (item) => item.type,
    },
    {
      field: 'sha1',
      name: 'sha1',
      sortable: false,
    },
  ];

  return (
    <EuiInMemoryTable
      columns={columns}
      items={values}
      loading={isLoading}
      pagination={{ pageSizeOptions: [5, 10, 20] }}
      sorting={{ sort: { field: 'date', direction: SortDirection.DESC } }}
    />
  );
};

/*
 * Wazuh app - Registry values components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import {
  EuiBasicTableColumn,
  EuiInMemoryTable,
  SortDirection,
} from '@elastic/eui';
import { WzRequest } from '../../../../../react-services';
import React, { useEffect, useState } from 'react';
import { emptyFieldHandler } from '../lib';
import { formatUIDate } from '../../../../../react-services/time-service';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { i18n } from '@kbn/i18n';

import { getErrorOrchestrator } from '../../../../../react-services/common-services';
const dateName = i18n.translate('wazuh.components.addModule.guide.dateName', {
  defaultMessage: 'Date',
});
const dateField = i18n.translate('wazuh.components.addModule.guide.dateField', {
  defaultMessage: 'date',
});
const valueName = i18n.translate('wazuh.components.addModule.guide.valueName', {
  defaultMessage: 'Value name',
});
const valueField = i18n.translate('wazuh.components.addModule.guide.valueField', {
  defaultMessage: 'value',
});
const valueTypeName = i18n.translate(
  'wazuh.components.addModule.guide.valueTypeName',
  {
    defaultMessage: 'Value type',
  },
);

const sha1Name = i18n.translate('wazuh.components.addModule.guide.sha1Name', {
  defaultMessage: 'sha1',
});

export const RegistryValues = props => {
  const [values, setValues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>();

  useEffect(() => {
    getValues().then(() => setIsLoading(false));
  }, []);

  const getValues = async () => {
    const { agent, currentFile, agentId } = props;
    try {
      const values = await WzRequest.apiReq(
        'GET',
        `/syscheck/${agent.id ? agent.id : agentId}`,
        {
          params: {
            q: `type=registry_value;file=${currentFile.file}`,
            sort: '-date',
          },
        },
      );

      setValues((((values || {}).data || {}).data || {}).affected_items || []);
    } catch (error) {
      setError(error);
      const options: UIErrorLog = {
        context: `${RegistryValues.name}.getValues`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
        error: {
          error: error,
          message: error.message || error,
          title: error.name,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  };

  const columns: EuiBasicTableColumn<any>[] = [
    {
      field: dateField,
      name: dateName,
      sortable: true,
      render: formatUIDate,
    },
    {
      field: valueField,
      name: valueName,
      sortable: true,
      render: item => emptyFieldHandler()(item.name || ''),
    },
    {
      field: valueField,
      name: valueTypeName,
      sortable: true,
      render: item => item.type,
    },
    {
      field: sha1Name,
      name: sha1Name,
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

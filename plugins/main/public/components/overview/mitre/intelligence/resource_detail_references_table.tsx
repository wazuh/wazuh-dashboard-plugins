/*
 * Wazuh app - React component for showing the Mitre Att&ck intelligence flyout tables.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState, useEffect } from 'react';
import { EuiAccordion, SortDirection, EuiInMemoryTable } from '@elastic/eui';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { getMitreResourcesByIds } from '../lib/get-mitre-resources-by-ids';

type backToTopType = () => void;

interface referencesTableType {
  referencesName: string;
  referencesLabel?: string;
  referencesArray: Array<string>;
  columns: any;
  backToTop: backToTopType;
}

export const ReferencesTable = ({
  referencesName,
  referencesLabel,
  referencesArray,
  columns,
  backToTop,
}: referencesTableType) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    getValues();
    backToTop();
  }, [referencesArray]);

  const getValues = async () => {
    setIsLoading(true);
    try {
      setData(await getMitreResourcesByIds(referencesName, referencesArray));
    } catch (error) {
      const options = {
        context: `${ReferencesTable.name}.getValues`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
    setIsLoading(false);
  };

  return (
    <EuiAccordion
      style={{ textDecoration: 'none' }}
      id=''
      className='events-accordion'
      buttonContent={
        referencesLabel ??
        referencesName.charAt(0).toUpperCase() + referencesName.slice(1)
      }
      paddingSize='none'
      initialIsOpen={true}
    >
      <EuiInMemoryTable
        columns={columns}
        items={data}
        loading={isLoading}
        pagination={{ pageSizeOptions: [5, 10, 20] }}
        sorting={{ sort: { field: 'name', direction: SortDirection.DESC } }}
      />
    </EuiAccordion>
  );
};

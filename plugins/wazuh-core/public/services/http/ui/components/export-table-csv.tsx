/*
 * Wazuh app - Table with search bar
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
import { EuiFlexItem, EuiButtonEmpty } from '@elastic/eui';

export function ExportTableCsv({
  fetchContext,
  totalItems,
  title,
  showToast,
  exportCSV,
}) {
  const downloadCSV = async () => {
    try {
      const { endpoint, filters } = fetchContext;
      const formattedFilters = Object.entries(filters || []).map(
        ([name, value]) => ({
          name,
          value,
        }),
      );
      showToast({
        color: 'success',
        title: 'Your download should begin automatically...',
        toastLifeTimeMs: 3000,
      });

      await exportCSV(endpoint, formattedFilters, title.toLowerCase());
    } catch (error) {
      // TODO: implement
      // const options = {
      //   context: `${ExportTableCsv.name}.downloadCsv`,
      //   level: UI_LOGGER_LEVELS.ERROR,
      //   severity: UI_ERROR_SEVERITIES.BUSINESS,
      //   error: {
      //     error: error,
      //     message: error.message || error,
      //     title: `${error.name}: Error downloading csv`,
      //   },
      // };
      // getErrorOrchestrator().handleError(options);
    }
  };

  return (
    <EuiFlexItem grow={false}>
      <EuiButtonEmpty
        isDisabled={totalItems === 0}
        iconType='importAction'
        onClick={downloadCSV}
      >
        Export formatted
      </EuiButtonEmpty>
    </EuiFlexItem>
  );
}

// Set default props
ExportTableCsv.defaultProps = {
  endpoint: '/',
  totalItems: 0,
  filters: [],
  title: '',
};

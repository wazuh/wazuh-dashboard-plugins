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
import {
  EuiFlexItem,
  EuiButtonEmpty
} from '@elastic/eui';
import { filtersToObject } from '../../../wz-search-bar/';
import exportCsv from '../../../../react-services/wz-csv';
import { getToasts }  from '../../../../kibana-services';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../react-services/common-services';

export function ExportTableCsv({ endpoint, totalItems, filters, title }) {

  const showToast = (color, title, time) => {
    getToasts().add({
      color: color,
      title: title,
      toastLifeTimeMs: time,
    });
  };

  const downloadCsv = async () => {
    try {
      const filtersObject = filtersToObject(filters);
      const formatedFilters = Object.keys(filtersObject).map(key => ({name: key, value: filtersObject[key]}));
      showToast('success', 'Your download should begin automatically...', 3000);
      await exportCsv(
        endpoint,
        [
          ...formatedFilters
        ],
        `${(title).toLowerCase()}`
      );
    } catch (error) {
      const options = {
        context: `${ExportTableCsv.name}.downloadCsv`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: `${error.name}: Error downloading csv`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }
  
  return <EuiFlexItem grow={false}>
  <EuiButtonEmpty isDisabled={(totalItems == 0)} iconType="importAction" onClick={() => downloadCsv()}>
    Export formatted
  </EuiButtonEmpty>
    </EuiFlexItem>
}

// Set default props
ExportTableCsv.defaultProps = {
    endpoint:'/',
    totalItems:0,
    filters: [],
    title:""
  };
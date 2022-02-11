/*
 * Wazuh app - Component to display the table in the Agent stats
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
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiInMemoryTable,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import * as FileSaver from '../../../services/file-saver';
import { formatUIDate } from '../../../react-services';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';

export function AgentStatTable({ columns, title, start, end, loading, items, exportCSVFilename }) {
  return (
    <EuiPanel>
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiText>{title}</EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText>
            <EuiIcon type="calendar" /> Start:{' '}
            {loading ? <EuiLoadingSpinner size="s" /> : start ? formatUIDate(start) : '-'} - End:{' '}
            {loading ? <EuiLoadingSpinner size="s" /> : end ? formatUIDate(end) : '-'}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiHorizontalRule margin="xs" />
      <EuiInMemoryTable columns={columns} items={items || []} loading={loading} pagination={true} />
      <EuiSpacer size="xs" />
      <EuiFlexGroup justifyContent="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            onClick={() => downloadCsv(columns, items, exportCSVFilename)}
            iconType="importAction"
            isDisabled={loading}
          >
            Download CSV
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
}

function downloadCsv(columns: any[], data: any[], filename: string) {
  try {
    const header = columns.map((column) => column.name).join(',');
    const body = data.map((row) => columns.map((column) => row[column.field]).join(',')).join('\n');
    const result = [header, body].join('\n');
    const blob = new Blob([result], { type: 'text/csv' }); // eslint-disable-line
    FileSaver.saveAs(blob, `${filename}.csv`);
  } catch (error) {
    const options: UIErrorLog = {
      context: 'downloadCsv',
      level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
      severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
      error: {
        error: error,
        message: `Error generating CSV: ${error.message}`,
        title: `CSV: ${error.name}`,
      },
    };
    getErrorOrchestrator().handleError(options);
  }
}

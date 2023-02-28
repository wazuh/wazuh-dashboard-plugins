/*
 * Wazuh app - React component for overview table.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';

import {
  EuiTable,
  EuiTableHeader,
  EuiTableHeaderCell,
  EuiTableBody,
  EuiTableRow,
  EuiTableRowCell,
  EuiSpacer,
  EuiTitle
} from '@elastic/eui';

class WzConfigurationOverviewTable extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { title, items, columns, onClick } = this.props;
    return (
      <Fragment>
        <EuiTitle size="s">
          <h2>{title}</h2>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiTable>
          <EuiTableHeader>
            {columns.map((column, key) => (
              <EuiTableHeaderCell key={`${title}-${column.name}`}>
                {column.name}
              </EuiTableHeaderCell>
            ))}
          </EuiTableHeader>
          <EuiTableBody>
            {items.map((item, key) => (
              <EuiTableRow
                key={`${title}-row-${key}`}
                onClick={() => onClick(item.goto, item.name, item.description)}
              >
                {columns.map((column, keyColumn) => (
                  <EuiTableRowCell
                    colSpan={keyColumn === 1 ? 2 : undefined}
                    key={`${item[column.field]}`}
                  >
                    {item[column.field]}
                  </EuiTableRowCell>
                ))}
              </EuiTableRow>
            ))}
          </EuiTableBody>
        </EuiTable>
        <EuiSpacer />
      </Fragment>
    );
  }
}

export default WzConfigurationOverviewTable;

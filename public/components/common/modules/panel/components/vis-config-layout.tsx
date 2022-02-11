/*
 * Wazuh app - React component VisConfigLayout.
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

import React from 'react';
import { EuiFlexGroup } from '@elastic/eui';

export const VisConfigLayout = ({ rowClickHandler, rows = [] }) => {
  return (
    <>
      {rows.map((row, key) => {
        return (
          <EuiFlexGroup
            key={key}
            className={'wz-margin-0'}
            style={{
              height: row.height || 'unset',
            }}
          >
            {row.columns.map((column, key) => {
              const growthFactor = Math.max(column.width ? parseInt(column.width / 10) : 1, 1);
              return (
                <column.component width={growthFactor} key={key} onRowClick={rowClickHandler} />
              );
            })}
          </EuiFlexGroup>
        );
      })}
    </>
  );
};

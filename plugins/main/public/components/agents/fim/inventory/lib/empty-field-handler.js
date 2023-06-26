/*
 * Wazuh app - Integrity monitoring components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { EuiCode, EuiIcon, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import React from 'react';

/* This function can be used to render possibly empty fields.
It takes a render function suitable for an EuiTable and returns another. */
export const emptyFieldHandler = (renderFn = (value, record) => value) => {
  return (value, record) => {
    if (value === '' || value === undefined) {
      return (
        <span style={{display:"flex", minWidth:"0"}}>
            <EuiIcon type="iInCircle" />
            <EuiCode className="wz-ellipsis" style={{whiteSpace:"nowrap"}}>Empty field</EuiCode>
        </span>
      );
    } else {
      return renderFn(value, record);
    }
  };
};

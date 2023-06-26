/*
 * Wazuh app - GitHub Panel tab - Main layout
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
import { EuiFlexGroup} from '@elastic/eui';
import { VisConfigLayout } from '../../../common/modules/panel';

export const Main = ({ changeView, toggleFilter, rows = [] }) => {

  const rowClickHandler = (field, value) => {
    toggleFilter(field, value);
    changeView(field);
  }

  return <VisConfigLayout rows={rows} rowClickHandler={rowClickHandler}/>
}
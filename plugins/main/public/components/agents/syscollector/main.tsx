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

import React from 'react';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withReduxProvider,
} from '../../common/hocs';
import { SyscollectorInventory } from './inventory';
import { compose } from 'redux';
import { itHygiene } from '../../../utils/applications';

export const MainSyscollector = compose(
  withReduxProvider,
  withErrorBoundary,
  withGlobalBreadcrumb(({ agent }) => {
    return [
      {
        text: itHygiene.title,
      },
      { agent },
      {
        text: 'Inventory Data',
      },
    ];
  }),
)(SyscollectorInventory);

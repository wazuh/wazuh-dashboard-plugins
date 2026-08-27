/*
 * Wazuh app - React test for WzStatusNodeInfo component.
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
import { screen } from '@testing-library/react';
import WzStatusNodeInfo from './status-node-info';
import { renderWithProviders } from '../../../../../redux/render-with-redux-provider';

describe('WzStatusNodeInfo', () => {
  it('renders the node information without a per-node Agents count', () => {
    renderWithProviders(<WzStatusNodeInfo />, {
      preloadedState: {
        statusReducers: {
          selectedNode: 'manager',
          nodeInfo: {
            version: 'v5.0.0',
            path: '/var/ossec',
            type: 'master',
          },
        },
      },
    });

    expect(screen.getByText('manager information')).toBeInTheDocument();
    expect(screen.getByText('v5.0.0')).toBeInTheDocument();
    expect(screen.queryByText('Agents')).not.toBeInTheDocument();
  });
});

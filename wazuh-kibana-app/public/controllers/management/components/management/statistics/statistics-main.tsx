/*
 * Wazuh app - React component for reporting
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';

import WzReduxProvider from '../../../../../redux/wz-redux-provider';
//Wazuh statistics overview
import WzStatisticsOverview from './statistics-overview';

function WzStatistics() {
  return (
    <WzReduxProvider>
      <WzStatisticsOverview />
    </WzReduxProvider>
  );
}

export default WzStatistics;

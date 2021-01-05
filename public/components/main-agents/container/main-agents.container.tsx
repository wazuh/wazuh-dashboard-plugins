/*
 * Wazuh app - React component for main overview
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useState } from 'react';
import { compose } from 'redux';
import { withGlobalBreadcrumb } from '../../common/hocs/withGlobalBreadcrumb';
import { WzAgents } from '../../agents/index';
import AppState from '../../../react-services/app-state';
import { useHistory } from 'react-router-dom';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

export const MainAgents = compose(withGlobalBreadcrumb([{ text: '' }, { text: 'Agents' }]))(
  () => {
     return (
       <WzAgents></WzAgents>
    );
  }
);
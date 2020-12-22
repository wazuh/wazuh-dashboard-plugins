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
import AppState from '../../../react-services/app-state';
import { withGlobalBreadcrumb } from '../../common/hocs/withGlobalBreadcrumb';
import { WzSecurity } from '../../security/index';
import { useHistory } from 'react-router-dom';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

export const MainSecurity = compose(withGlobalBreadcrumb([{ text: '' }, { text: 'Security' }]))(
  () => {
     return (
       <WzSecurity></WzSecurity>
      //  <p>SECURITY</p>
      // <EuiFlexGroup direction="column">
      //   <EuiFlexItem grow={false}>
      //     <OverviewStats summary={agentsSummary} />
      //   </EuiFlexItem>
      //   <EuiFlexItem grow={false}>
      //     <OverviewWelcome extensions={extensions} />
      //   </EuiFlexItem>
      // </EuiFlexGroup>
    );
  }
);

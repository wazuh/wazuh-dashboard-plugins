/*
 * Wazuh app - React component for showing the Mitre Att&ck intelligence welcome.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
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
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

export const ModuleMitreAttackIntelligenceAllResourcesWelcome = () => (
  <EuiFlexGroup justifyContent='center'>
    <EuiFlexItem>
      <EuiTitle><h1>{'MITRE ATT&CK intelligence'}</h1></EuiTitle>
      <EuiSpacer />
      <EuiText color='subdued'>
        <p>{'Get information about the MITRE ATT&CK resources.'}</p>
        <p>On the left panel, list the different resources. Click on some of them to get more information about them.</p>
      </EuiText>
    </EuiFlexItem>
  </EuiFlexGroup>
);
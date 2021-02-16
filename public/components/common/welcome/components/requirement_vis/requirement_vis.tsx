/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
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

import React, { useState } from 'react'
import {
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
} from '@elastic/eui';
import { RequirementsHead, RequirementsBody } from './components';

export function RequirementVis(props) {
  const [requirement, setRequirement] = useState('pci_dss');
  return (
    <EuiFlexItem>
      <EuiPanel paddingSize="s">
        <EuiFlexItem>
          <RequirementsHead requirement={requirement} setRequirement={setRequirement} />
          <EuiSpacer size="m" />
          <RequirementsBody requirement={requirement} {...props} />
        </EuiFlexItem>
      </EuiPanel>
    </EuiFlexItem>
  )
}

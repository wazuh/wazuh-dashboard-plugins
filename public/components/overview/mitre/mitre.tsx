/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react'
import { Tactics, Techniques } from './components'; 
import { 
  EuiPage,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';

export class Mitre extends Component {
  render() {
    return (
      <EuiPage>
        <EuiPanel paddingSize="none">
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <Tactics />
            </EuiFlexItem>
            <EuiFlexItem>
              <Techniques />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiPage>
    );
  }
}


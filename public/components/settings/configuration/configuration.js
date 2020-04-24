/*
 * Wazuh app - React component building the configuration component.
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

import React, { Component } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiToolTip,
  EuiPanel,
  EuiPage,
  EuiTitle,
  EuiText
} from '@elastic/eui';
import { WzConfigurationTable } from './configuration-table';

export class WzConfigurationSettings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      apiEntries: [],
      refreshingEntries: false
    };
  }

  componentDidMount() {}

  render() {
    return (
      <EuiPage>
        <EuiPanel paddingSize="l">
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiTitle>
                    <h2>
                      App current settings&nbsp;
                      <EuiToolTip
                        position="right"
                        content="More about configuration file"
                      >
                        <EuiButtonIcon
                          iconType="questionInCircle"
                          iconSize="l"
                          aria-label="Help"
                          target="_blank"
                          href="https://documentation.wazuh.com/current/user-manual/kibana-app/reference/config-file.html"
                        ></EuiButtonIcon>
                      </EuiToolTip>
                    </h2>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiText color="subdued" style={{ paddingBottom: '15px' }}>
                Configuration file located at
                /usr/share/kibana/optimize/wazuh/config/wazuh.yml
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <WzConfigurationTable {...this.props} />
        </EuiPanel>
      </EuiPage>
    );
  }
}

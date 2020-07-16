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
  EuiFlexItem,
  EuiPanel,
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
} from '@elastic/eui';
import { WzConfigurationTable } from './configuration-table';
import { Header, Categories } from './components';

export class WzConfigurationSettings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      apiEntries: [],
      refreshingEntries: false
    };
  }

  componentDidMount() { }

  render() {
    return (
      <EuiPage >
        <EuiPageBody Component="div">
          <EuiPageHeader>
            <Header />
          </EuiPageHeader>
          <Categories all={[]}/>



          <br/>
          ⬇ TO DELETE ⬇
          <br/>
          <EuiFlexItem>
            <EuiPanel paddingSize="l">
              <WzConfigurationTable {...this.props} />
            </EuiPanel>
          </EuiFlexItem>
        </EuiPageBody>
      </EuiPage>
    );
  }
}

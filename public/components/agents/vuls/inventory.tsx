/*
 * Wazuh app - Agent vulnerabilities components
 * Copyright (C) 2015-2021 Wazuh, Inc.
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
  EuiPanel,
  EuiPage,
  EuiSpacer,
  EuiProgress,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import {
  InventoryTable,
} from './inventory/';
import { ICustomBadges } from '../../wz-search-bar/components';

export class Inventory extends Component {
  _isMount = false;
  state: {
    isLoading: Boolean;
    customBadges: ICustomBadges[];
  };

  props: any;

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      customBadges: []
    }
  }

  async componentDidMount() {
    this._isMount = true;
    await this.loadAgent();
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  async loadAgent() {
    if (this._isMount){
      this.setState({  isLoading: false });
    }
  }

  renderTable() {
    return (
      <div>
          <InventoryTable
            {...this.props}/>
      </div>
    )
  }
  
  loadingInventory() {
    return <EuiPage>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiProgress size="xs" color="primary" />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPage>;
  }


  render() {
    const { isLoading } = this.state;
    if (isLoading) {
      return this.loadingInventory()
    }
    const table = this.renderTable();

    return <EuiPage>
        <EuiPanel>
          <EuiSpacer size={(((this.props.agent || {}).os || {}).platform || false) === 'windows' ? 's' : 'm'} />
          {table}
        </EuiPanel>
      </EuiPage>
  }
}

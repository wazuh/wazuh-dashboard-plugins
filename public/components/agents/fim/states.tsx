
/*
 * Wazuh app - Integrity monitoring components
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
  EuiPanel,
  EuiPage,
  EuiTabs,
  EuiTab,
  EuiSpacer,
  EuiTitle,
  EuiLoadingSpinner
} from '@elastic/eui';
import {
  StatesTable,
  FilterBar,
  RegistryTable
} from './states/';
import { WzRequest } from '../../../react-services/wz-request';

export class States extends Component {
  state: {
    filters: {},
    selectedTabId: String,
    totalItemsFile: Number,
    totalItemsRegistry: Number,
    isLoading: Boolean
  }
  props: any;

  constructor(props) {
    super(props);

    this.state = {
      filters: {},
      selectedTabId: 'files',
      totalItemsFile: 0,
      totalItemsRegistry: 0,
      isLoading: true
    }
  }

  tabs() {
    let auxTabs = [
      {
        id: 'files',
        name: `Files ${this.state.isLoading === true ? '' : '('+this.state.totalItemsFile+')'}`,
        disabled: false,
      },
    ]
    this.props.agent.os.platform === 'windows' ? auxTabs.push(
      {
        id: 'registry',
        name: `Windows Registry ${this.state.isLoading === true ? '' : '('+this.state.totalItemsRegistry+')'}`,
        disabled: false,
      },
    ) : null;
    return (auxTabs);
  }

  async componentDidMount() {
    await this.getTotalFiles();
    await this.getTotalRegistry();
    this.setState({isLoading: false});
  }

  onFiltersChange(filters) {
    this.setState({ filters });
  }

  onSelectedTabChanged = id => {
    this.setState({ selectedTabId: id });
  }

  async getTotalFiles() {
    const agentID = this.props.agent.id;
    const totalItemsFile = await WzRequest.apiReq(
      'GET',
      `/syscheck/${agentID}`,
      {
        limit: '1',
        type: 'file'
      }
    );
    this.setState({ totalItemsFile: ((totalItemsFile.data || {}).data || {}).totalItems || 0 });
  }

  async getTotalRegistry() {
    const agentID = this.props.agent.id;
    const totalItemsRegistry = await WzRequest.apiReq(
      'GET',
      `/syscheck/${agentID}`,
      {
        limit: '1',
        type: 'registry'
      }
    );
    this.setState({ totalItemsRegistry: ((totalItemsRegistry.data || {}).data || {}).totalItems || 0 });
  }

  renderTabs() {
    const tabs = this.tabs();
    const { isLoading } = this.state;
    if (tabs.length > 1) {
      return (
        <EuiTabs>
          {tabs.map((tab, index) => (
            <EuiTab
              onClick={() => this.onSelectedTabChanged(tab.id)}
              isSelected={tab.id === this.state.selectedTabId}
              disabled={tab.disabled}
              key={index}>
              {tab.name}&nbsp;{isLoading === true && <EuiLoadingSpinner />}
            </EuiTab>
          ))}
        </EuiTabs>
      )
    } else {
      return (
        <EuiTitle size="s">
          <h1> {tabs[0].name}&nbsp;{isLoading === true && <EuiLoadingSpinner />}</h1>
        </EuiTitle>
      )
    }
  }

  renderFiles() {
    const { filters } = this.state;
    return (
      <div>
        <FilterBar
          onFiltersChange={this.onFiltersChange.bind(this)} />
        <StatesTable
          {...this.props}
          filters={filters} />
      </div>
    )
  }

  renderWindowRegistry() {
    return (
      <RegistryTable />
    )
  }

  render() {
    const files = this.renderFiles();
    const registry = this.renderWindowRegistry();
    const tabs = this.renderTabs()
    const { selectedTabId } = this.state;
    return (
      <EuiPage>
        <EuiPanel>
          {tabs}
          <EuiSpacer size="m" />
          {selectedTabId === 'files' && files}
          {this.props.agent.os.platform === 'windows' && (selectedTabId === 'registry' && registry)}
        </EuiPanel>
      </EuiPage>
    )
  }
}
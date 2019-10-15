/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
// Eui components
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPage,
  EuiText,
  EuiTitle,
  EuiSearchBar
} from '@elastic/eui';
// Redux
import store from '../../../../redux/store';
import WzReduxProvider from '../../../../redux/wz-redux-provider';
// Wazuh components
import WzSectionSelector from './section-selector';
import WzRulesetTable from './ruleset-table';
import WzRulesetActionButtons from './actions-buttons';


export default class WzRuleset extends Component {
  constructor(props) {
    super(props);

    this.state = {
      section: this.props.section
    }

  }
  async componentDidMount() {
    //Trying a request await this.props.wzReq('GET', '/rules/files', { limit: 500, offset: 0 });
    store.subscribe(() => {
      const state = store.getState().rulesetReducers;
      const section = state.section;
      this.setState({ section: section });
    });
  }

  render() {
    // Search bar
    const searchBar = (
      <EuiSearchBar
        box={{
          placeholder: `Filter ${this.state.section}...`
        }}
        onChange={() => { console.log('changing') }}
      />
    );

    return (
      <WzReduxProvider>
        <EuiPage style={{ background: 'transparent' }}>
          <EuiPanel>

            {/* Section title: Rules/Decoders/CDBlists */}
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiTitle>
                  <h2>Ruleset</h2>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem>{/* This EuiFlexItem separates the title from the action buttons */}</EuiFlexItem>
              {/* Action buttons */}
              <WzRulesetActionButtons />
            </EuiFlexGroup>

            {/* Description */}
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiText color="subdued">
                  From here you can manage your rules, decoders and CDB lists.
              </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>

            {/* Search bar and section selector*/}
            <EuiFlexGroup>
              <EuiFlexItem>
                {searchBar}
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                {/* Selector */}
                <WzSectionSelector />
              </EuiFlexItem>
            </EuiFlexGroup>

            {/* Table */}
            <EuiFlexGroup>
              <EuiFlexItem>
                <WzRulesetTable wzReq={(method, path, options) => this.props.wzReq(method, path, options)} />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiPage>
      </WzReduxProvider>
    )
  }
}


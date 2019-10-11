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
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPage,
  EuiText,
  EuiTitle,
  EuiSearchBar,
  EuiSelect,
  EuiButtonEmpty
} from '@elastic/eui';

import PropTypes from 'prop-types';


export class MainRuleset extends Component {
  constructor(props) {
    super(props);

    this.state = {
      section: this.props.section
    }

    this.sectionOptions = [
      { value: 'rules', text: 'Rules' },
      { value: 'decoders', text: 'Decoders' },
      { value: 'lists', text: 'CDB lists' },
    ];
  }

  async componentDidMount() {
    console.log('MainRuleset mounted ', this.state);
    const r = await this.props.wzReq('GET', '/rules/files', {limit: 500, offset: 0});
    console.log('Request: ', r);
  }

  onSectionChange = e => {
    this.setState({
      section: e.target.value,
    });
  };


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

    // Section selector
    const sectionSelector = (
      <EuiSelect
        id="selectRulesetSection"
        options={this.sectionOptions}
        value={this.state.section}
        onChange={this.onSectionChange}
        aria-label="Section selector"
      />
    );

    // Export button
    const exportButton = (
      <EuiButtonEmpty
        iconType="exportAction"
        onClick={async () => console.log('exporting')}
      >
        Export formatted
      </EuiButtonEmpty>
    );
    
    // Add new rule button
    const addNewRuleButton = (
      <EuiButtonEmpty
        iconType="plusInCircle"
        onClick={async () => console.log('adding new')}
      >
        {`Add new ${this.state.section} files`}
      </EuiButtonEmpty>
    );

    // Manage files
    const manageFiles = (
      <EuiButtonEmpty
        iconType="folderClosed"
        onClick={async () => console.log('managing files')}
      >
        {`Manage ${this.state.section} files`}
      </EuiButtonEmpty>  
    );

    return (
      <EuiPage style={{ background: 'transparent' }}>
        {/* Main panel */}
        <EuiPanel>
          {/* Section title: Rules/Decoders/CDBlists */}
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiTitle>
                <h2>Ruleset</h2>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem>{/* This EuiFlexItem separates the title from the action buttons */}</EuiFlexItem>
            <EuiFlexItem grow={false}>
              {manageFiles}
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              {addNewRuleButton}
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              {exportButton}
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiText color="subdued">
                From here you can manage your rules, decoders and CDB lists.
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          {/* Search bar and select to change between sections*/}
          <EuiFlexGroup>
            <EuiFlexItem>
              {searchBar}
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              {sectionSelector}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiPage>
    )
  }
}

MainRuleset.propTypes = {
  section: PropTypes.string,
  wzReq: PropTypes.func
};
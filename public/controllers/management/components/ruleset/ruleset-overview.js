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

import { connect } from 'react-redux';

// Wazuh components
import WzSectionSelector from './section-selector';
import WzRulesetTable from './ruleset-table';
import WzRulesetActionButtons from './actions-buttons';

class WzRulesetOverview extends Component {
  constructor(props) {
    super(props);
    this.sectionNames = {
      rules: 'Rules',
      decoders: 'Decoders',
      lists: 'CDB lists'
    }
  }

  render() {
    const { section } = this.props.state;
    // Search bar
    const searchBar = (
      <EuiSearchBar
        box={{
          placeholder: `Filter ${section}...`
        }}
        onChange={() => { console.log('changing') }}
      />
    );
    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel>
          {/* Section title: Rules/Decoders/CDBlists */}
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiTitle>
                <h2>{this.sectionNames[section]}</h2>
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
                {`From here you can manage your ${section}.`}
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
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers
  };
};

export default connect(mapStateToProps)(WzRulesetOverview);

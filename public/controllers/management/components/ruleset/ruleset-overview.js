import React, { Component } from 'react';
// Eui components
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPage,
  EuiText,
  EuiTitle
} from '@elastic/eui';

import { connect } from 'react-redux';

// Wazuh components
import WzSectionSelector from './section-selector';
import WzRulesetTable from './ruleset-table';
import WzRulesetActionButtons from './actions-buttons';
import { WzFilterBar } from '../../../../components/wz-filter-bar/wz-filter-bar';

class WzRulesetOverview extends Component {
  constructor(props) {
    super(props);
    this.sectionNames = {
      rules: 'Rules',
      decoders: 'Decoders',
      lists: 'CDB lists'
    }
    this.model = [
      {
        label: 'Level',
        options: [
          {
            label: '0',
            group: 'level'
          },
          {
            label: '1',
            group: 'level'
          },
          {
            label: '2',
            group: 'level'
          }
        ]
      },
    ];
  }


  clickActionFilterBar(obj) {
    console.log('clicking ', obj)
  }

  render() {
    const { section } = this.props.state;

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
              <WzFilterBar
                model={this.model}
                clickAction={(obj) => this.clickActionFilterBar(obj)}
              />
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

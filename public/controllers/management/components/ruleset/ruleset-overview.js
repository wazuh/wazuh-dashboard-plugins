import React, { Component } from 'react';
// Eui components
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPage,
  EuiText,
  EuiTitle,
  EuiSwitch,
  EuiPopover,
  EuiButtonIcon,
  EuiButtonEmpty
} from '@elastic/eui';

import { connect } from 'react-redux';

// Wazuh components
import WzRulesetTable from './ruleset-table';
import WzRulesetActionButtons from './actions-buttons';
import WzRulesetFilterBar from './ruleset-filter-bar';
import './ruleset-overview.css';

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

    this.filters = {
      rules: [
        { label: 'File', value: 'file' }, { label: 'Path', value: 'path' }, { label: 'Level', value: 'level' },
        { label: 'Group', value: 'group' }, { label: 'PCI control', value: 'pci' }, { label: 'GDPR', value: 'gdpr' }, { label: 'HIPAA', value: 'hipaa' }, { label: 'NIST-800-53', value: 'nist-800-53' }
      ],
      decoders: [
        { label: 'File', value: 'file' }, { label: 'Path', value: 'path' }
      ]
    };

    this.state = {
      isPopoverOpen: false
    }
  }


  clickActionFilterBar(obj) {
    console.log('clicking ', obj)
  }

  onButtonClick() {
    this.setState({
      isPopoverOpen: !this.state.isPopoverOpen,
    });
  }

  closePopover() {
    this.setState({
      isPopoverOpen: false,
    });
  }

  render() {
    const { section } = this.props.state;

    const button = (
      <EuiButtonIcon
        style={{ padding: 12 }}
        color='primary'
        onClick={() => this.onButtonClick()}
        iconType="filter"
        aria-label="Filter"
      />
    );

    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel>
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiTitle>
                <h2>{this.sectionNames[section]}</h2>
              </EuiTitle>
            </EuiFlexItem>
            {(section == 'rules' || section === 'decoders') && (
              <EuiFlexItem grow={false} style={{ paddingTop: 7 }}>
                <EuiSwitch
                  label={`Custom ${this.sectionNames[section]}`}
                  checked={false}
                  onChange={this.clickActionFilterBar}
                />
              </EuiFlexItem>
            )}
            <EuiFlexItem>
            </EuiFlexItem>
            <WzRulesetActionButtons />
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiText color="subdued">
                {`From here you can manage your ${section}.`}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <WzRulesetFilterBar />
            </EuiFlexItem>
            {(section === 'rules' || section === 'decoders') &&
              <EuiFlexItem grow={false} style={{ marginLeft: 0 }}>
                <EuiPopover
                  id="trapFocus"
                  ownFocus
                  button={button}
                  isOpen={this.state.isPopoverOpen}
                  anchorPosition="downRight"
                  closePopover={this.closePopover.bind(this)}>
                  {this.filters[section].map((filter, idx) => (
                    <div key={idx}>
                      <EuiButtonEmpty size="s"
                        iconSide='right'
                        onClick={() => this.applyFilter(filter.value)}>
                        {filter.label}
                      </EuiButtonEmpty>
                    </div>
                  ))}
                </EuiPopover>
              </EuiFlexItem>
            }
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <WzRulesetTable />
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

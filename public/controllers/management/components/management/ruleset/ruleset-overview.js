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
} from '@elastic/eui';

import { connect } from 'react-redux';

// Wazuh components
import WzRulesetTable from './ruleset-table';
import WzRulesetActionButtons from './actions-buttons';
import './ruleset-overview.css';
import WzSearchBar from '../../../../../components/wz-search-bar/wz-search-bar';
import { updateFilters, updateIsProcessing } from '../../../../../redux/actions/rulesetActions';
import { WzRequest } from '../../../../../react-services/wz-request';


class WzRulesetOverview extends Component {
  constructor(props) {
    super(props);
    this.sectionNames = {
      rules: 'Rules',
      decoders: 'Decoders',
      lists: 'CDB lists'
    }
  }


  clickActionFilterBar(obj) {
    console.log('clicking ', obj)
  }


  render() {
    const { section } = this.props.state;

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
          <WzSearchBar
            qSuggests={[
              {
                label: 'status',
                description: 'Filters the rules by status.',
                operators: ['=', '!='],
                values: ['enabled', 'disabled'],
              },
              // TODO: Wait to framework team fix this call
              // {
              //   label: 'group',
              //   description: 'Filters the rules by group',
              //   operators: ['=', '!=', '~'],
              //   values: async () => {
              //     const wzReq = (...args) => WzRequest.apiReq(...args);
              //     const result = await wzReq('GET', '/rules/groups', {});
              //     return (((result || {}).data || {}).data || {}).items;
              //   },
              // },
              {
                label: 'level',
                description: 'Filters the rules by level',
                operators: ['=', '!=', '<', '>'],
                values: [...Array(16).keys()],
              },
              {
                label: 'file',
                description: 'Filters the rules by file name.',
                operators: ['=', '!='],
                values: async () => {
                  const wzReq = (...args) => WzRequest.apiReq(...args);
                  const result = await wzReq('GET', '/rules/files', {});
                  return (((result || {}).data || {}).data || {}).items.map((item) => {return item.file});
                },
              },
              // TODO: Wait to framework team fix this call
              // {
              //   label: 'path',
              //   description: '',
              //   operators: ['=', '!=', '~'],
              //   values: async () => {
              //     const wzReq = (...args) => WzRequest.apiReq(...args);
              //     const result = await wzReq('GET', '/manager/configuration', {
              //       section:'ruleset',
              //       field: 'rule_dir',
              //     });
              //     console.log(result.data)
              //     return ((result || {}).data || {}).data;
              //   }
              // },


            ]}            
            onInputChange={(filters) => {this.props.updateFilters(filters); this.props.updateIsProcessing(true)}} />
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

const mapDispatchToProps = (dispatch) => {
  return {
    updateFilters: filters => dispatch(updateFilters(filters)),
    updateIsProcessing: isProcessing => dispatch(updateIsProcessing(isProcessing)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzRulesetOverview);

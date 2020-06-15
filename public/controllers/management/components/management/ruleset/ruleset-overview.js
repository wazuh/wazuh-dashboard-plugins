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
import {
  updateAdminMode
} from '../../../../../redux/actions/appStateActions';

import { connect } from 'react-redux';
import checkAdminMode from './utils/check-admin-mode';

// Wazuh components
import WzRulesetTable from './ruleset-table';
import WzRulesetSearchBar from './ruleset-search-bar';
import WzRulesetActionButtons from './actions-buttons';
import './ruleset-overview.css';
import { updateGlobalBreadcrumb } from '../../../../../redux/actions/globalBreadcrumbActions';
import store from '../../../../../redux/store';
import { WzRulesetTotalItems } from './ruleset-total-items';

class WzRulesetOverview extends Component {
  constructor(props) {
    super(props);
    this.sectionNames = {
      rules: 'Rules',
      decoders: 'Decoders',
      lists: 'CDB lists'
    };
  }

  componentDidMount() {
    this.setAdminMode();
  }

  async setAdminMode() {
    //Set the admin mode
    const admin = await checkAdminMode();
    this.props.updateAdminMode(admin);
  }

  setGlobalBreadcrumb() {
    const breadcrumb = [
      { text: '' },
      { text: 'Management', href: '/app/wazuh#/manager' },
      { text: this.sectionNames[this.props.state.section] }
    ];
    store.dispatch(updateGlobalBreadcrumb(breadcrumb));
  }

  componentDidUpdate() {
    this.setGlobalBreadcrumb();
  }

  clickActionFilterBar(obj) {
    console.log('clicking ', obj);
  }

  render() {
    const { section } = this.props.state;

    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel>
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiTitle>
                <h2>{this.sectionNames[section]} <WzRulesetTotalItems section={section}/></h2>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem></EuiFlexItem>
            <WzRulesetActionButtons />
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiText color="subdued">
                {`From here you can manage your ${section}.`}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <WzRulesetSearchBar />
          <EuiFlexGroup>
            <EuiFlexItem>
              <WzRulesetTable request={`${section}`} />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateAdminMode: status => dispatch(updateAdminMode(status)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
  )(WzRulesetOverview);

/*
 * Wazuh app - React component for building the groups table.
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
  EuiFlexGroup,
  EuiPanel,
  EuiTitle,
  EuiText,
  EuiPage
} from '@elastic/eui';

// Wazuh components
import WzGroupsTable from './groups-table';
import WzGroupsActionButtons from './actions-buttons-main';

import { connect } from 'react-redux';
import { updateAdminMode } from '../../../../../redux/actions/groupsActions';
import checkAdminMode from './utils/check-admin-mode';

export class WzGroupsOverview extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this._isMounted = true;
    this.setAdminMode();
  }

  componentDidUpdate() {}

  componentWillUnmount() {
    this._isMounted = false;
  }

  async setAdminMode() {
    //Set the admin mode
    const admin = await checkAdminMode();
    this.props.updateAdminMode(admin);
  }

  render() {
    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiTitle>
                    <h2>Groups</h2>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <WzGroupsActionButtons />
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiText color="subdued" style={{ paddingBottom: '15px' }}>
                From here you can list and check your groups, its agents and
                files.
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <WzGroupsTable />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.groupsReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateAdminMode: status => dispatch(updateAdminMode(status))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzGroupsOverview);

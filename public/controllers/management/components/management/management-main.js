/*
 * Wazuh app - React component for all management section.
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
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
// Redux
import store from '../../../../redux/store';

import WzManagementSideMenu from './management-side-menu';
import WzRuleset from './ruleset/main-ruleset';
import WzGroups from './groups/groups-main';
import WzStatus from './status/status-main';
import WzReporting from './reporting/reporting-main';
import WzConfiguration from './configuration/configuration-main'
// import { GroupsTable } from './groups/groups-table';
// import { changeManagementSection } from '../../../../redux/reducers/managementReducers';
import { connect } from 'react-redux';

class WzManagementMain extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.store = store;
  }

  render() {
    const { section } = this.props;
    const ruleset = ['ruleset', 'rules', 'decoders', 'lists'];
    return (
      <EuiFlexGroup>
        <EuiFlexItem grow={false} style={{ width: 190, marginRight: 0 }}>
          <WzManagementSideMenu section={section} {...this.props} />
        </EuiFlexItem>
        <EuiFlexItem style={{ marginLeft: '7px' }}>
          <div>
            {(section === 'groups' && <WzGroups {...this.props} />) ||
              (section === 'status' && <WzStatus />) ||
              (section === 'reporting' && <WzReporting />) || 
              (section === 'configuration' && <WzConfiguration {...this.props.configurationProps} />) ||
              (ruleset.includes(section) && <WzRuleset />)}
          </div>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
}

function mapStateToProps(state) {
  return {
    state: state.managementReducers,
  };
}

export default connect(mapStateToProps, {})(WzManagementMain);

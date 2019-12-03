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
// Redux
// import store from '../../../../../redux/store';
import WzReduxProvider from '../../../../../redux/wz-redux-provider';
//Wazuh groups overview
import WzStatusOverview from './status-overview';
//Information about rule or decoder
// import WzGroupDetail from './group-detail';
// import WzGroupEditor from './groups-editor';

// import { updateShowAddAgents, resetGroup } from '../../../../../redux/actions/groupsActions';
// import { connect } from 'react-redux';

class WzStatus extends Component {
  constructor(props) {
    super(props);
    this.state = {}; //Init state empty to avoid fails when try to read any parameter and this.state is not defined yet
    // this.store = store;
  }

  UNSAFE_componentWillMount() {
    // this.store.subscribe(() => {
    //   const state = this.store.getState().groupsReducers;
    //   this.setState(state);
    // });
  }

  componentWillUnmount() {
    // When the component is going to be unmounted the groups state is reset
  }

  render() {

    return (
      <WzReduxProvider>
        <WzStatusOverview />
        {/* {!showAddAgents &&
          ((itemDetail && !fileContent && <WzGroupDetail {...this.props} />) ||
            (fileContent && <WzGroupEditor />) || <WzGroupsOverview />)} */}
      </WzReduxProvider>
    );
  }
}

// const mapStateToProps = state => {
//   return {
//     state: state.groupsReducers,
//   };
// };

// const mapDispatchToProps = dispatch => {
//   return {
//     resetGroup: () => dispatch(resetGroup()),
//     updateShowAddAgents: showAddAgents => dispatch(updateShowAddAgents(showAddAgents)),
//   };
// };

export default (WzStatus);

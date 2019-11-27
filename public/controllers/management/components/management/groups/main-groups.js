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
import store from '../../../../../redux/store';
import WzReduxProvider from '../../../../../redux/wz-redux-provider';
//Wazuh ruleset groups
import WzGroupsOverview from './groups-overview';
//Information about rule or decoder
import WzGroupDetail from './group-detail';
// import WzDecoderInfo from './decoder-info';
// import WzRulesetEditor from './ruleset-editor';
// import WzListEditor from './list-editor';

import { updateShowAddAgents } from '../../../../../redux/actions/groupsActions';
import { connect } from 'react-redux';

class WzGroups extends Component {
  constructor(props) {
    super(props);
    this.state = {}; //Init state empty to avoid fails when try to read any parameter and this.state is not defined yet
    this.store = store;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.groupsProps.closeAddingAgents && this.state.showAddAgents) {
      this.setState({
        closeAddingAgents: true,
      });
      this.props.updateShowAddAgents(false);
    }
  }

  UNSAFE_componentWillMount() {
    this.store.subscribe(() => {
      const state = this.store.getState().groupsReducers;
      this.setState(state);
    });
  }

  componentWillUnmount() {
    // When the component is going to be unmounted the ruleset state is reset
    // const { ruleInfo, decoderInfo, listInfo, fileContent, addingRulesetFile } = this.state;
    // if (!ruleInfo && !decoderInfo && !listInfo && !fileContent, !addingRulesetFile) this.store.dispatch({ type: 'RESET' });
  }

  render() {
    // const { ruleInfo, decoderInfo, listInfo, fileContent, addingRulesetFile } = this.state;
    const { itemDetail, showAddAgents } = this.state;

    return (
      <WzReduxProvider>
        {!showAddAgents &&
          ((itemDetail && <WzGroupDetail {...this.props} />) || (
            // || decoderInfo && (<WzDecoderInfo />)
            // || listInfo && (<WzListEditor />)
            // || (fileContent || addingRulesetFile) && (<WzRulesetEditor />)
            <WzGroupsOverview />
          ))}
      </WzReduxProvider>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.groupsReducers,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateShowAddAgents: showAddAgents => dispatch(updateShowAddAgents(showAddAgents)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzGroups);

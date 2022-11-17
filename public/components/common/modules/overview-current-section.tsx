/*
 * Wazuh app - React component for building the Overview welcome screen.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';
import { updateCurrentTab } from '../../../redux/actions/appStateActions';
import store from '../../../redux/store';
import { connect } from 'react-redux';
import { WAZUH_MODULES } from '../../../../common/wazuh-modules';

class WzCurrentOverviewSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  setGlobalBreadcrumb() {
    const currentAgent = store.getState().appStateReducers.currentAgentData;

    if(WAZUH_MODULES[this.props.currentTab]){
      const breadcrumb = currentAgent.id ? [
        { text: '' },
        { text: 'Modules', href: '#/overview' },
        { agent: currentAgent },
        { text: WAZUH_MODULES[this.props.currentTab].title},
      ] :
      [
        { text: '' },
        { text: 'Modules', href: '#/overview' },
        
        
        { text: WAZUH_MODULES[this.props.currentTab].title},
      ];
      store.dispatch(updateGlobalBreadcrumb(breadcrumb));
      $('#breadcrumbNoTitle').attr("title","");
    }
  }

  componentDidMount() {
    this.setGlobalBreadcrumb();
    store.dispatch(updateCurrentTab(this.props.currentTab));
  }


  async componentDidUpdate() {
    if(this.props.state.currentTab !== this.props.currentTab){
      const forceUpdate = this.props.tabView === 'discover';
      if(this.props.state.currentTab) this.props.switchTab(this.props.state.currentTab,forceUpdate);
    }
    this.setGlobalBreadcrumb();
  }
  
  componentWillUnmount(){
    store.dispatch(updateCurrentTab("")); 
  }

  render() {
    return (
      <span>
      {/*this.props.currentTab && WAZUH_MODULES[this.props.currentTab] && WAZUH_MODULES[this.props.currentTab].title && (
      <EuiTitle size='s'>
        <h2>
          {WAZUH_MODULES[this.props.currentTab].title}
       </h2>
      </EuiTitle>)*/}
        </span>
    );
  }
}



const mapStateToProps = state => {
  return {
    state: state.appStateReducers,
  };
};

export default connect(mapStateToProps, null)(WzCurrentOverviewSection);
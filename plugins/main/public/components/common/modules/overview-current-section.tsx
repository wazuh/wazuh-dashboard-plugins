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
import { getWzCurrentAppID } from '../../../kibana-services';
import { Applications } from '../../../utils/applications';

class WzCurrentOverviewSection extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  setGlobalBreadcrumb() {
    const currentAgent = store.getState().appStateReducers.currentAgentData;

    const section = Applications.find(
      ({ id }) => getWzCurrentAppID() === id,
    )?.breadcrumbLabel;

    if (section) {
      const breadcrumb = currentAgent.id
        ? [
            {
              text: section,
            },
            { agent: currentAgent },
          ]
        : [{ text: section }];
      store.dispatch(updateGlobalBreadcrumb(breadcrumb));
      $('#breadcrumbNoTitle').attr('title', '');
    }
  }

  componentDidMount() {
    this.setGlobalBreadcrumb();
    store.dispatch(updateCurrentTab(this.props.currentTab));
  }

  async componentDidUpdate() {
    if (this.props.state.currentTab !== this.props.currentTab) {
      const forceUpdate = this.props.tabView === 'discover';
      if (this.props.state.currentTab)
        this.props.switchTab(this.props.state.currentTab, forceUpdate);
    }
    this.setGlobalBreadcrumb();
  }

  componentWillUnmount() {
    store.dispatch(updateCurrentTab(''));
  }

  render() {
    return <span></span>;
  }
}

const mapStateToProps = state => {
  return {
    state: state.appStateReducers,
  };
};

export default connect(mapStateToProps, null)(WzCurrentOverviewSection);

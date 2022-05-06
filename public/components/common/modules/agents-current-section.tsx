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
import {
  EuiTitle
} from '@elastic/eui';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';
import { updateCurrentTab } from '../../../redux/actions/appStateActions';
import store from '../../../redux/store';
import { connect } from 'react-redux';
import { WAZUH_MODULES } from '../../../../common/wazuh-modules';
import { getAngularModule } from '../../../kibana-services';

// TODO: check if this component is deprecated, if so remove it.
// This component is wrapped by WzCurrentAgentsSectionWrapper
class WzCurrentAgentsSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  setGlobalBreadcrumb() {
    if (WAZUH_MODULES[this.props.currentTab]) {
      const breadcrumb = [
        { text: '' },
        {
          text: 'Agents',
          href: "#/agents-preview"
        },
        {
          text: `${this.props.agent.name} (${this.props.agent.id})`,
          onClick: () => {
            window.location.href = `#/agents?agent=${this.props.agent.id}`;
            this.router.reload();
          },
          className: 'wz-global-breadcrumb-btn euiBreadcrumb--truncate',
          truncate: false,
        },
        { text: WAZUH_MODULES[this.props.currentTab].title },
      ];
      store.dispatch(updateGlobalBreadcrumb(breadcrumb));
    }
  }

  async componentDidMount() {
    this.setGlobalBreadcrumb();
    store.dispatch(updateCurrentTab(this.props.currentTab));
    const $injector = getAngularModule().$injector;
    this.router = $injector.get('$route');
  }


  async componentDidUpdate() {
    if (this.props.state.currentTab !== this.props.currentTab) {
      const forceUpdate = this.props.tabView === 'discover';
      if (this.props.state.currentTab) this.props.switchTab(this.props.state.currentTab, forceUpdate);
    }
    this.setGlobalBreadcrumb();
  }

  componentWillUnmount() {
    store.dispatch(updateCurrentTab(""));
  }

  render() {
    return (
      <span>
        {this.props.currentTab && WAZUH_MODULES[this.props.currentTab] && WAZUH_MODULES[this.props.currentTab].title && (
          <EuiTitle size='s'>
            <h2>
              {WAZUH_MODULES[this.props.currentTab].title}
            </h2>
          </EuiTitle>)}
      </span>
    );
  }
}



const mapStateToProps = state => {
  return {
    state: state.appStateReducers,
  };
};

export default connect(mapStateToProps, null)(WzCurrentAgentsSection);
/*
 * Wazuh app - React component for registering agents.
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
import { EuiFlexGroup, EuiFlexItem, EuiFlexGrid, EuiButtonEmpty, EuiSideNav, EuiIcon, EuiPanel, EuiStat, EuiButton, EuiToolTip } from '@elastic/eui';
import { WzRequest } from '../../react-services/wz-request';
import { connect } from 'react-redux';
import store from '../../redux/store';
import chrome from 'ui/chrome';
import { updateCurrentTab, updateCurrentAgentData } from '../../redux/actions/appStateActions';
import { AppState } from '../../react-services/app-state';
import { AppNavigate } from '../../react-services/app-navigate';

class WzMenuTools extends Component {
  constructor(props) {
    super(props);

    this.tools = [
      { id: 'devTools', text: 'Dev Console' },
      { id: 'logtest', text: 'Logtest' }
    ];
  }


  async componentDidMount() {
    const $injector = await chrome.dangerouslyGetActiveInjector();
    this.router = $injector.get('$route');
  }

  clickMenuItem = (ev, section) => {
    this.props.closePopover();
    AppNavigate.navigateToModule(ev, 'tools', { tab: section });
    if (this.props.currentMenuTab === 'tools') {
      this.router.reload();
    }
  };

  createItem = (item, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    return {
      ...data,
      id: item.id,
      name: item.text,
      isSelected: this.props.state.section === item.id,
      onClick: () => { },
      onMouseDown: (ev) => this.clickMenuItem(ev, item.id)
    };
  };

  render() {
    const sideNav = [
      this.createItem({'id':'tools', 'text': 'Tools'}, {
        icon: <EuiIcon type="console" color="primary" />,
        items: this.tools.map(tool => this.createItem(tool))
      })
    ]


    return (
      <div className="WzManagementSideMenu" style={{ width: 200 }}>
        <EuiFlexGroup responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiSideNav items={sideNav} style={{ padding: '4px 12px' }} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers,
  };
};

export default connect(
  mapStateToProps
)(WzMenuTools);
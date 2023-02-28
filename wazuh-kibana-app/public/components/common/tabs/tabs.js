/*
 * Wazuh app - React component for section tabs.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { EuiTabs, EuiTab } from '@elastic/eui';

export class Tabs extends Component {
  constructor(props) {
    super(props);

    this.tabs = [];
    this.props.tabs.forEach(tab => {
      this.tabs.push({
        id: tab.id,
        name: tab.name
      });
    });

    this.state = {
      selectedTabId: this.props.selectedTab
    };
  }

  onSelectedTabChanged = id => {
    this.setState({
      selectedTabId: id
    });
    this.props.clickAction(id);
  };

  renderTabs() {
    return this.tabs.map((tab, index) => (
      <EuiTab
        onClick={() => this.onSelectedTabChanged(tab.id)}
        isSelected={tab.id === this.state.selectedTabId}
        key={index}
        style={{ fontWeight: 200 }}
      >
        {tab.name}
      </EuiTab>
    ));
  }

  render() {
    return (
      <Fragment>
        <EuiTabs display={this.props.condensed ? 'condensed' : 'default'}>
          {this.renderTabs()}
        </EuiTabs>
      </Fragment>
    );
  }
}

Tabs.propTypes = {
  tabs: PropTypes.array,
  selectedTab: PropTypes.string,
  clickAction: PropTypes.func
};

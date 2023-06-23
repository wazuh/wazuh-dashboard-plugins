/*
 * Wazuh app - React components for create tabs and tab.
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

import { EuiTabs, EuiTab, EuiSpacer } from '@elastic/eui';

class WzTabSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTab: this.props.children[0].props.label
    };
  }
  changeSelectedTab(tab) {
    this.setState({ selectedTab: tab });
  }
  render() {
    const { selectedTab } = this.state;
    const { children, container, spacer } = this.props;
    const activeTabContent = children.filter(child => child).find(
      child => child.props.label === selectedTab
    );
    return (
      <Fragment>
        <EuiTabs>
          {children.filter(child => child).map(child => {
            const { label } = child.props;
            return (
              <EuiTab
                onClick={() => this.changeSelectedTab(label)}
                isSelected={label === selectedTab}
                key={`tab-${label}`}
              >
                {label}
              </EuiTab>
            );
          })}
        </EuiTabs>
        {(container && container(activeTabContent)) || (
          <div>
            <EuiSpacer size={spacer || 'm'} />
            {activeTabContent}
          </div>
        )}
      </Fragment>
    );
  }
}

WzTabSelector.propTypes = {
  children: PropTypes.array.isRequired,
  spacer: PropTypes.string
};

export default WzTabSelector;

export class WzTabSelectorTab extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <Fragment>{this.props.children}</Fragment>;
  }
}

WzTabSelectorTab.propTypes = {
  label: PropTypes.string
};

/*
 * Wazuh app - React component for render settings with a list selector.
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

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiSpacer,
  EuiPanel
} from '@elastic/eui';

import WzConfigurationSettingsGroup from './configuration-settings-group';
import { getUiSettings } from '../../../../../../kibana-services';

const IS_DARK_THEME = getUiSettings().get('theme:darkMode');

class WzConfigurationSettingsListSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedItem: 0
    };
  }
  selectItem(selectedItem) {
    this.setState({ selectedItem });
  }
  render() {
    const { selectedItem } = this.state;
    const { items, settings, keyList } = this.props;
    return (
      <Fragment>
        <EuiSpacer size="m" />
        <EuiFlexGroup alignItems="flexStart">
          <EuiFlexItem grow={false} style={{ maxWidth: 25, minWidth: 250 }}>
            <EuiPanel style={{ background: IS_DARK_THEME ? '#1a1b20' : '#fafbfd' }}>
              <ul>
                {items.map((item, key) => (
                  <li key={`${keyList}-${key}`}>
                    <EuiButtonEmpty
                      style={
                        selectedItem === key
                          ? { textDecoration: 'underline' }
                          : {}
                      }
                      onClick={() => this.selectItem(key)}
                    >
                      {item.label}
                    </EuiButtonEmpty>
                  </li>
                ))}
              </ul>
            </EuiPanel>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiPanel>
              <WzConfigurationSettingsGroup
                config={items[selectedItem].data}
                items={settings}
              />
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    );
  }
}

WzConfigurationSettingsListSelector.propTypes = {
  items: PropTypes.array.isRequired,
  settings: PropTypes.array.isRequired,
  keyList: PropTypes.string
};

export default WzConfigurationSettingsListSelector;

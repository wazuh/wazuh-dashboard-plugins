/*
 * Wazuh app - React component for render group of settings.
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
  EuiSpacer,
} from '@elastic/eui';

import WzConfigurationSetting from './configuration-setting';
import WzConfigurationSettingsHeader from './configuration-settings-header';

class WzSettingsGroup extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const {
      config,
      description,
      items,
      json,
      help,
      title,
      settings,
      viewSelected,
      xml
    } = this.props;
    return (
      <Fragment>
        <WzConfigurationSettingsHeader
          title={title}
          description={description}
          settings={settings}
          json={json}
          xml={xml}
          help={help}
          viewSelected={viewSelected}
        />
        <EuiSpacer size="s" />
        <EuiFlexGroup>
          <EuiFlexItem>
            {items.map((item, key) => {
              const keyItem = `${title || ''}-${item.label}-${
                item.value
              }-${key}`;
              return (
                <WzConfigurationSetting
                  key={keyItem}
                  keyItem={keyItem}
                  label={item.label}
                  value={
                    item.render
                      ? item.render(config[item.field])
                      : config[item.field]
                  }
                />
              );
            })}
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    );
  }
}

WzSettingsGroup.propTypes = {
  ...WzConfigurationSettingsHeader.propTypes,
  items: PropTypes.array.isRequired
};

export default WzSettingsGroup;

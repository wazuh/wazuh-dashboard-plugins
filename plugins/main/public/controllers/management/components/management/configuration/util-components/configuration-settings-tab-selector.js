/*
 * Wazuh app - React component for render settings, json and xml tab selector.
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

import WzConfigurationSettingsHeader from './configuration-settings-header';

class WzConfigurationSettingsTabSelector extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { helpLinks, children } = this.props;
    const { title, description } = this.props;
    
    return (
      <Fragment>
        <WzConfigurationSettingsHeader
          title={title}
          description={description}
          help={helpLinks}
        />
        {children}
      </Fragment>
    );
  }
}

export default WzConfigurationSettingsTabSelector;

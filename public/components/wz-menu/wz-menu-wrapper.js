/*
 * Wazuh app - React component for building the WzMenu component.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */
import React, { Component } from 'react';
import WzMenu from './wz-menu';
import WzReduxProvider from '../../redux/wz-redux-provider';
import './wz-menu.less';

export class WzMenuWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <WzReduxProvider>
        <WzMenu {...this.props} />
      </WzReduxProvider>
    );
  }
}

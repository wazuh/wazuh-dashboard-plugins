/*
 * Wazuh app - React component for status
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

import WzReduxProvider from '../../../../../redux/wz-redux-provider';
//Wazuh groups overview
import WzStatusOverview from './status-overview';
import { updateGlobalBreadcrumb } from '../../../../../redux/actions/globalBreadcrumbActions';
import store from '../../../../../redux/store';

class WzStatus extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  setGlobalBreadcrumb() {
    const breadcrumb = [
      { text: '' },
      { text: 'Management', href: '/app/wazuh#/manager' },
      { text: 'Status' }
    ];
    store.dispatch(updateGlobalBreadcrumb(breadcrumb));
  }

  componentDidMount() {
    this.setGlobalBreadcrumb();
  }

  render() {
    return (
      <WzReduxProvider>
        <WzStatusOverview />
      </WzReduxProvider>
    );
  }
}

export default WzStatus;

/*
 * Wazuh app - React component for show main configuration.
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
import WzConfigurationSwitch from './configuration-switch';
import { updateGlobalBreadcrumb } from '../../../../../redux/actions/globalBreadcrumbActions';
import store from '../../../../../redux/store';
import chrome from 'ui/chrome';

class WzConfigurationMain extends Component {
  constructor(props) {
    super(props);
  }

  setGlobalBreadcrumb() {
    let breadcrumb = false;
    if (this.props.agent.id === '000') {
      breadcrumb = [
        { text: '' },
        { text: 'Management', href: '/app/wazuh#/manager' },
        { text: 'Configuration' }
      ];
    } else {
      breadcrumb = [
        { text: '' },
        {
          text: 'Agents',
          href: '#/agents-preview'
        },
        { agent: this.props.agent },
        { text: 'Configuration' }
      ];
    }
    store.dispatch(updateGlobalBreadcrumb(breadcrumb));
    $('#breadcrumbNoTitle').attr("title","");
  }

  async componentDidMount() {
    const $injector = await chrome.dangerouslyGetActiveInjector();
    this.router = $injector.get('$route');
    this.setGlobalBreadcrumb();
  }

  render() {
    return (
      <WzReduxProvider>
        <WzConfigurationSwitch {...this.props} />
      </WzReduxProvider>
    );
  }
}

export default WzConfigurationMain;

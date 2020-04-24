/*
 * Wazuh app - Integrity monitoring components
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
import { getAngularModule } from 'plugins/kibana/discover/kibana_services';
import { EuiLoadingSpinner, EuiSpacer } from '@elastic/eui';

const app = getAngularModule('app/wazuh');

export class Loader extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.$rootScope = app.$injector.get('$rootScope');
    this.$rootScope.loadingDashboard = true;
    this.$rootScope.$applyAsync();
  }

  componentWillUnmount() {
    this.$rootScope.loadingDashboard = false;
    this.$rootScope.$applyAsync();
  }

  redirect() {
    setTimeout(() => {
      this.props.loadSection(this.props.redirect);
    }, 100);
  }

  render() {
    const redirect = this.redirect();
    return (
      <Fragment>
        <EuiSpacer size='xl' />
        <div style={{ margin: '-8px auto', width: 32 }}>
          <EuiLoadingSpinner size="xl" />
        </div>
        {redirect}
      </Fragment>
    );
  }
}

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
import { EventsSelectedFiles } from './events-selected-fields'
import { EventsFim } from '../../agents/fim/events';
export class Events extends Component {
  constructor(props) {
    super(props);
  }

  async getDiscoverScope() {
    const app = getAngularModule('app/wazuh');
    const fields = EventsSelectedFiles[this.props.section];
    if (fields && app.discoverScope && app.discoverScope.addColumn) {
      app.discoverScope.state.columns = [];
      fields.forEach(field => {
        if (!app.discoverScope.state.columns.includes(field)) {
          app.discoverScope.addColumn(field);
        }
      });
    } else {
      setTimeout(() => { this.getDiscoverScope() }, 200);
    }
  }

  async componentDidMount() {
    const app = getAngularModule('app/wazuh');
    this.$rootScope = app.$injector.get('$rootScope');
    this.$rootScope.showModuleEvents = this.props.section;
    this.$rootScope.$applyAsync();
    this.getDiscoverScope();
  }

  componentWillUnmount() {
    this.$rootScope.showModuleEvents = false;
    this.$rootScope.$applyAsync();
  }

  render() {
    return (
      <Fragment>
        {this.props.section === 'fim' &&
          <EventsFim {...this.props}></EventsFim>
        }
      </Fragment>
    )
  }
}

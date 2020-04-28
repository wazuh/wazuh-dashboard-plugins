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
import { ModulesHelper } from './modules-helper'
export class Events extends Component {
  constructor(props) {
    super(props);
    this.modulesHelper = ModulesHelper;
  }

  async componentDidMount() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    const app = getAngularModule('app/wazuh');
    this.$rootScope = app.$injector.get('$rootScope');
    this.$rootScope.showModuleEvents = this.props.section;
    this.$rootScope.$applyAsync();
    const scope = await this.modulesHelper.getDiscoverScope();
    this.$rootScope.moduleDiscoverReady = true;
    this.$rootScope.$applyAsync();
    const fields = EventsSelectedFiles[this.props.section];
    if (fields) {
      scope.state.columns = [];
      fields.forEach(field => {
        if (!scope.state.columns.includes(field)) {
          scope.addColumn(field);
        }
      });
    }
    this.fetchWatch = scope.$watchCollection('fetchStatus',
      () => {
        if (scope.fetchStatus === 'complete') {
          setTimeout(() => { this.modulesHelper.cleanAvailableFields() }, 1000);
        }
      });
  }

  componentWillUnmount() {
    if (this.fetchWatch) this.fetchWatch();
    this.$rootScope.showModuleEvents = false;
    this.$rootScope.moduleDiscoverReady = false;
    this.$rootScope.$applyAsync();
  }

  render() {
    return (
      <Fragment>
        {this.props.section === 'fim' && <EventsFim {...this.props}></EventsFim>}
      </Fragment>
    )
  }
}

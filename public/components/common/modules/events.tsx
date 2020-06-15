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
import { EventsSelectedFiles } from './events-selected-fields';
import { EventsFim } from '../../agents/fim/events';
import { EventsMitre } from './mitre-events';
import { ModulesHelper } from './modules-helper';
import store from '../../../redux/store';

export class Events extends Component {
  constructor(props) {
    super(props);
    this.modulesHelper = ModulesHelper;
    this.isMount = true;
  }

  async componentDidMount() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    const app = getAngularModule('app/wazuh');
    this.$rootScope = app.$injector.get('$rootScope');
    this.$rootScope.showModuleEvents = this.props.section;
    const scope = await this.modulesHelper.getDiscoverScope();
    if(this.isMount){
      this.$rootScope.moduleDiscoverReady = true;
      this.$rootScope.$applyAsync();
      const fields = EventsSelectedFiles[this.props.section];
      const index = fields.indexOf('agent.name');
      if (index > -1 && store.getState().appStateReducers.currentAgentData.id) { //if an agent is pinned we don't show the agent.name column
        fields.splice(index, 1);
      }
      if (fields) {
        scope.state.columns = fields;
        scope.addColumn(false);
        scope.removeColumn(false);
      }
      this.fetchWatch = scope.$watchCollection('fetchStatus',
        () => {
          if (scope.fetchStatus === 'complete') {
            setTimeout(() => { this.modulesHelper.cleanAvailableFields() }, 1000);
          }
        });
    }
  }

  componentWillUnmount() {
    this.isMount = false;
    if (this.fetchWatch) this.fetchWatch();
    this.$rootScope.showModuleEvents = false;
    this.$rootScope.moduleDiscoverReady = false;
    this.$rootScope.$applyAsync();
  }

  render() {
    return (
      <Fragment>
        {this.props.section === 'fim' && <EventsFim {...this.props}></EventsFim>}
        {this.props.section === 'mitre' && <EventsMitre {...this.props}></EventsMitre>}
      </Fragment>
    )
  }
}
